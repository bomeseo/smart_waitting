from datetime import datetime
from .ColorString import ColorString

class LogSet():
    def __init__(self):
        self.defineType = {
            "INFO":(255,255,255),
            "WARN":(255,255,0),
            "ERROR":(255,0,0),
            "NONE":(230,230,230),
        }
        self.MSG = []


    def _formSet(self,type='INFO',msg='null'):
        return f'[{type}][{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}'

    def Log(self,type='NONE',msg='null'):
        text = ColorString(self._formSet("INFO",msg),self._formSet(type))
        print(text)
        return text

    def INFO(self,msg='null'):
        text = ColorString(self._formSet("INFO",msg),self.defineType["INFO"])
        print(text)
        return text

    def WARN(self,msg='null'):
        text = ColorString(self._formSet("WARN",msg),self.defineType["WARN"])
        print(text)
        return text
    
    def ERROR(self,msg='null'):
        text = ColorString(self._formSet("ERROR",msg),self.defineType["ERROR"])
        print(text)
        return text
