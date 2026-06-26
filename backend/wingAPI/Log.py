from .modlue_Log.Log import LogSet
_Log = LogSet()
def Info(text):_Log.INFO(text)
def Warn(text): _Log.WARN(text)
def Error(text):_Log.ERROR(text)