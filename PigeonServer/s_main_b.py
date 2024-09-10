import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
import jwt
import datetime

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Secret key for encoding and decoding the JWT token
SECRET_KEY = 'your-secret-key'

# Fake user for testing
fake_users = [
    {
        "username": "testuser",
        "password": "testpassword"
    },
    {
        "username": "testuser2",
        "password": "testpassword2"
    },
    {
        "username": "testuser3",
        "password": "testpassword3"
    }
]


class User(BaseModel):
    uid: str
    password: str


class TokenData(BaseModel):
    username: Optional[str] = None


def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=0, minutes=5),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        username: str = payload.get("user_id")
        if username is None:
            raise HTTPException(
                status_code=401, detail="Could not validate credentials"
            )
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Signature expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token. Please log in again.")


@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    for user in fake_users:
        if form_data.username == user["username"] and form_data.password == user["password"]:
            return {"access_token": generate_token(form_data.username), "token_type": "bearer"}
    raise HTTPException(status_code=400, detail="Incorrect username or password")


@app.get("/users/me")
async def read_users_me(username: str = Depends(verify_token)):
    return {"username": username}


@app.get("/user")
async def currnt_user(username: str = Depends(verify_token)):
    for user in fake_users:
        if username == user["username"]:
            return {"username": username}
    raise HTTPException(status_code=400, detail="User not found")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
