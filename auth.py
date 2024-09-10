# auth.py
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

SECRET_KEY = "Hippopotomonstrosesquippedaliophobia"
ALGORITHM = "HS256"
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def verify_password(plain_password, hashed_password):
    return bcrypt_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return bcrypt_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return email

# from s_main


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
