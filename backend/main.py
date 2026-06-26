import wingAPI as wp
from wingAPI.Server import CorlStr

ADDR = ('localhost',4000)
server = wp.Server()



class reserveData():
    def __init__(self,average,accent,name):
        self.reserved:int = 0
        self.completed:int = 0
        self.average:int = average
        self.accent:str = accent
        self.name:str = name


RESERVE = {
    'vr' : reserveData(7,"#1f6feb","VR 건강 체험"),
    'photo' : reserveData(5,"#c64f7c","AI 사진관"),
    'kiosk' : reserveData(6,"#d97706", "키오스크 연습"),
    'robot' : reserveData(9,"#6b5bd6", "돌봄 로봇 체험")
}



@server.recv('reserve')
async def reserve(obj:wp.ClientObj, data:dict):
    content = data['content']
    count = data['count']
    wp.Warn('asd')
    RESERVE[content].reserved += count

    print(vars(RESERVE[content]))

@server.recv('renewData')
async def renew(obj:wp.ClientObj, data:dict):
    wp.Error('asd')

    _all = []
    for k,v in RESERVE.items():
        _all.append({
            'id': k,
            'name': v.name,
            'reserved': v.reserved,
            'completed': v.completed,
            'average': v.average,
            'accent': v.accent
        })
    obj.send('renew',{"all":_all})
    



@server.error()
async def error_func(obj,e):
    pass
@server.end()
async def end_func(s):
    pass


@server.core()
async def core_func(): 
    pass

if __name__ == '__main__':
    server.open(ADDR)
    Lock = server.getLock()