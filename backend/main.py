import wingAPI as wp  
from wingAPI.Server import CorlStr
import asyncio
import time
import threading
import pygame
import os


ADDR = ('localhost', 4000)
server = wp.Server()

class reserveData():
    def __init__(self, average, accent, name):
        self.reserved: int = 0
        self.completed: int = 0
        self.average: int = average # 걍 스킨
        
        self.time: int = average * 60  # 진짜 계산에 쓰이는 시간 
        
        self.accent = pygame.Color(accent)
        self.accent_2 = accent
        self.name: str = name
        self.last_completed_time: float = time.time()

RESERVE = {
    'vr': reserveData(7, "#1f6feb", "VR 건강 체험"),
    'photo': reserveData(5, "#c64f7c", "AI 사진관"),
    'kiosk': reserveData(6, "#d97706", "키오스크 연습"),
    'robot': reserveData(9, "#6b5bd6", "돌봄 로봇 체험")
}

def get_all_data():
    _all = []
    for k, v in RESERVE.items():
        _all.append({
            'id': k,
            'name': v.name,
            'reserved': v.reserved,
            'completed': v.completed,
            'average': v.average,
            'accent': v.accent_2
        })
    return _all

@server.recv('reserve')
async def reserve(obj: wp.ClientObj, data: dict):
    content = data['content']
    count = data['count']
    RESERVE[content].reserved += count
    await server.broadcastClient('renew', {"all": get_all_data()})

@server.recv('renewData')
async def renew(obj: wp.ClientObj, data: dict):
    obj.send('renew', {"all": get_all_data()})

@server.error()
async def error_func(obj, e): pass
@server.end()
async def end_func(s): pass



@server.core()
async def core_func(): 
    while True:
        current_time = time.time()
        data_changed = False

        for k, v in RESERVE.items():
            cycle_time = v.time
            if v.reserved > v.completed:
                if current_time - v.last_completed_time >= cycle_time:
                    v.completed += 1
                    v.last_completed_time = current_time
                    data_changed = True
            else:
                v.last_completed_time = current_time

        if data_changed:
            await server.broadcastClient('renew', {"all": get_all_data()})

        await asyncio.sleep(0.1)



def run_pygame_gui():
    pygame.init()
    screen = pygame.display.set_mode((800, 600))
    pygame.display.set_caption("스마트 웨이팅 서버 시뮬레이터")
    clock = pygame.time.Clock()

    try:
        font_title = pygame.font.SysFont("malgungothic", 24, bold=True)
        font_text = pygame.font.SysFont("malgungothic", 16)
    except:
        font_title = pygame.font.Font(None, 32)
        font_text = pygame.font.Font(None, 24)

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                os._exit(0)

        screen.fill((20, 20, 25)) 
        pygame.draw.rect(screen, (30, 30, 40), (0, 0, 800, 60))
        title_surf = font_title.render("실시간 대기열 대시보드 (Server Status)", True, (255, 255, 255))
        screen.blit(title_surf, (20, 15))

        y_offset = 90
        current_time = time.time()

        for key, item in RESERVE.items():
            # 카드 배경
            pygame.draw.rect(screen, (35, 35, 45), (20, y_offset, 760, 100), border_radius=8)
            # 포인트 액센트 바
            pygame.draw.rect(screen, item.accent, (20, y_offset, 8, 100), border_radius=8)

            # 텍스트 정보 출력
            name_surf = font_title.render(item.name, True, (255, 255, 255))
            screen.blit(name_surf, (45, y_offset + 15))

            waiting_cnt = max(0, item.reserved - item.completed)
            info_str = f"전체 예약: {item.reserved}명  |  이용 완료: {item.completed}명  |  대기 인원: {waiting_cnt}명"
            info_surf = font_text.render(info_str, True, (180, 180, 190))
            screen.blit(info_surf, (45, y_offset + 55))

            # 프로그레스 바 구현 (퇴장까지 남은 시간 시각화)
            bar_width = 250
            bar_height = 12
            bar_x = 510
            bar_y = y_offset + 45
            
            # 게이지 배경
            pygame.draw.rect(screen, (50, 50, 60), (bar_x, bar_y, bar_width, bar_height), border_radius=6)
            
            if waiting_cnt > 0:
                elapsed = current_time - item.last_completed_time
                progress = min(1.0, elapsed / item.time)
                # 진행도에 따른 게이지 충전
                pygame.draw.rect(screen, item.accent, (bar_x, bar_y, int(bar_width * progress), bar_height), border_radius=6)
                
                rem_time = max(0.0, item.time - elapsed)
                time_str = f"다음 퇴장까지: {rem_time:.1f}초"
            else:
                time_str = "대기 없음"

            time_surf = font_text.render(time_str, True, (200, 200, 200))
            screen.blit(time_surf, (510, y_offset + 20))

            y_offset += 120

        pygame.display.flip()
        clock.tick(30)



if __name__ == '__main__':
    gui_thread = threading.Thread(target=run_pygame_gui, daemon=True)
    gui_thread.start()
    server.open(ADDR)
    Lock = server.getLock()
    os._exit(0)