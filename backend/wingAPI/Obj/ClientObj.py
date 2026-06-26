import websockets
from ..NewId import NewId
from ..ReservedWord import RESERVED_WORD
import time
import json
from traceback import format_exc
from ..Log import Error

class ClientObj():
    def __init__(self,websc:websockets.ServerConnection,id=None):
        self.connectTime = time.time()
        self.address = websc.remote_address
        self.websc = websc
        self.id = id
        if self.id == None: self.id = f'CLIENT{NewId()}'
        self.isLoginUser = False
        self.sendReserve = []
        self.uid = None

    def getSocket(self): return self.websc

    def getId(self) -> str:return self.id

    def getUser(self) -> str :return self.uid
    
    def connectUser(self,_id:str) -> bool:
        if type(_id) == str:
            self.uid = _id
            self.isLoginUser = True
            return True
        else:raise Exception("잘못된 인자값 타입:id")

    async def closeSocket(self):
        await self.websc.close()
        self.address = []
        self.isLoginUser = False
        self.sendReserve = []


    
    def addressGet(self) -> list:
        addr = list(self.address)
        if self.address[0] == '::1': addr[0] = 'localhost'
        return addr

    def send(self,code: str | int, data:dict) -> bool:
        if code == None or data == None:
            raise Exception("WhitePaper: 코드혹은 데이터가 없습니다")
        self.sendReserve.append(json.dumps({
            f"{RESERVED_WORD[0]}":code,
            f"{RESERVED_WORD[1]}":data
        }))
        return True

    async def _send_(self) -> bool:
        for i in self.sendReserve:
            await self.websc.send(i)
        self.sendReserve = []