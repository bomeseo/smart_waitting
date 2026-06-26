from ..NewId import NewId
from .ClientObj import ClientObj

class UserObj():
    def __init__(self,nickname,password,id=None,ClientObj=None):
        self.nickname = nickname
        self.password = password
        self.ClientObj = ClientObj
        self.tag = []
        self.role = 'visitor'
        self.right:list = []
        self.id = id
        if self.id == None: self.id = f'USEROBJ{NewId()}'
        self.isLogin = False
        self.isOnline = False
        self.save = {
            'inventory':['gun','plank_block','plank_block','plank_block','plank_block','apple','plank_block','plank_block','plank_block','plank_block']
        }
        # self.health = 100

    def giveRight(self,r) -> None: self.right.append(r)
    def depriveRight(self,r) -> None: self.right.remove(r)
    def addRight(self,r) -> None: self.right.append(r)
    def rmRight(self,r) -> None:
        if r in self.right:self.right.remove(r)
    def setRole(self,r) -> None: self.role = r
    def addTag(self,t) -> None: self.tag.append(t)
    def rmTag(self,t) -> None:
         if t in self.tag: self.tag.remove(t)
    def changeIsLogin(self,state) -> None: self.isLogin = state
    def changeConnectClient(self,clientObj:ClientObj) -> None: self.ClientObj = clientObj
    def saveEdit(self,data:list[any,any]) -> None: self.save[data[0]] = data[1]
    # def setHealth(self,health:int) -> None: self.health = health
    # def addHealth(self,health:int) -> None: self.health += health
    # def subHealth(self,health:int) -> None: self.health -= health

    def getSave(self) -> dict: return self.save
    def isDie(self) -> int: return self.health < 0
    def getId(self) -> str:return self.id
    def getNickname(self) -> str:return self.nickname
    def getPassword(self) -> str:return self.password
    def getRight(self) -> list:return self.right
    def getRole(self) -> str:return self.role
    def getTag(self) -> list:return self.tag
    def getIsLogin(self) -> bool:return self.isLogin
    def getConnectClient(self) -> ClientObj :return self.ClientObj
    # def getHealth(self) -> int:return self.health




