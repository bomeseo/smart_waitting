import secrets,string
CHARACTERS = string.ascii_letters + string.digits
def NewId(length=48):return ''.join(secrets.choice(CHARACTERS) for _ in range(length))
