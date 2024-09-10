import base64
import json

from fastapi import FastAPI, status, File, UploadFile, Response, Form, Body
from fastapi.security import OAuth2PasswordBearer
from starlette.middleware.cors import CORSMiddleware

import auth
import baseDbConnector
import mongoDbConnector
import Recommendation
from normalize_url import url_normalize
from typing import List, Optional
import fastapi.middleware.cors
from fastapi import FastAPI, Depends,HTTPException
from auth import get_current_user, get_password_hash


import jwt

app = FastAPI()

# Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend's origin here (e.g., "http://localhost:5500")
    allow_credentials=True,
    allow_methods=["*"],  # You can limit this to specific methods (e.g., ["GET", "POST"])
    allow_headers=["*"],  # You can limit this to specific headers
)

monConnector: baseDbConnector = mongoDbConnector.MongoDbConnector()
monConnector.connect()
Recommendation.connector = monConnector
# region User CRUD


@app.post("/user")
async def create_user(email: str = None, uname: str = None, password: str = None):
    print(f"User {uname} created with email {email}")
    print(f"Password: {password}")
    try:
        if not monConnector.add_user(email, uname, password):
            return {"message": "Failed to add user"}
    except baseDbConnector.DbOperationFailedException as e:
        return {"message": "Failed to add user"}
    return {"email": email, "uname": uname}


@app.delete("/user")
async def delete_user(email: str = None, password: str = None):
    monConnector.remove_user(email, password)
    return "User id: " + email + " successfully removed."


# V2ed
@app.put("/user")
async def update_user(email: str = None, n_uname: str = None, password: str = None, n_password: str = None):
    if not monConnector.edit_user(email, n_uname, password, n_password):
        return "Failed to update user."
    return "User id: ", email, " successfully updated."


@app.post("/register")
async def register(email: str = Form(...), uname: str = Form(...), password: str = Form(...)):
    hashed_password = get_password_hash(password)
    user = monConnector.register_user(email, uname, hashed_password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    return {"message": "User created successfully"}


@app.post("/login")
async def login(email: str = Form(...), password: str = Form(...)):
    user = monConnector.get_user(email)
    if user == 'User not found.' or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not auth.verify_password(password, user["hash_pass"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = jwt.encode({"sub": email}, auth.SECRET_KEY)
    return {"access_token": token, "token_type": "bearer"}


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


@app.get("/users")
def get_current_token(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return email
    except :
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# endregion


# region Tag CRUD
@app.post("/tag")
async def create_tag(
    uid: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None),
    picture: UploadFile = File(...),
    description: Optional[str] = Form(None)
):
    url = url_normalize(url)
    keywords = json.loads(keywords) if keywords else []
    try:
        data = await picture.read()
        if not monConnector.create_tag(uid, url, title, keywords, data, description):
            return {"message": "Failed to add tag"}

    except baseDbConnector.DbOperationFailedException as e:
        return {"message": "Failed to add tag"}
    return {"message": "Successfully added search"}


@app.put("/tag")
# async def update_tag(uid: str = None, url: str = None, title: str = None,
#                     picture: UploadFile = File(...), description: str = None):
async def update_tag(
    uid: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    # keywords: Optional[str] = Form(None),
    picture: UploadFile = File(...),
    description: Optional[str] = Form(None)
):
    url = url_normalize(url)
    pic = await picture.read()
    monConnector.update_tag(uid, url, title, pic, description)
    return "Tag successfully updated."


@app.delete("/tag")
async def delete_tag(uid: str = None, url: str = None):
    url = url_normalize(url)
    monConnector.remove_tag(uid, url)
    return "Tag successfully removed."


@app.put("/keyword")
async def add_keywords(
    uid: str = Body(...),
    url: str = Body(...),
    keywords: list[str] = Body(...)
):
    url = url_normalize(url)
    keywords = keywords[0].split(",")  # Assuming keywords is sent as a single comma-separated string in a list
    monConnector.add_keywords(uid, url, keywords)
    return {"message": "Keywords successfully added."}


@app.delete("/keyword")
async def delete_keywords(
    uid: str = Body(...),
    url: str = Body(...),
    keywords: list[str] = Body(...)
):
    url = url_normalize(url)
    keywords = keywords[0].split(",")  # Assuming keywords is sent as a single comma-separated string in a list
    monConnector.remove_keyword(uid, url, keywords)
    return {"message": "Keywords successfully removed."}


@app.get("/tag")
async def get_tags_by_uid(uid: str = None):
    # return {"message": "Not implemented."}
    res = monConnector.get_tags_by_uid(uid)
    dtr = []
    for r in res:
        dtr.append({
            "uid": r["uid"],
            "url": r["url"],
            "title": r["title"],
            "keywords": r["keywords"],
            "picture": r["picture"],
            "description": r["description"]
        })
    return dtr
# endregion
# region Recommendation
@app.post("/recommend_by_kw")
async def recommend_by_keywords(
    keywords: list[str] = Body(...),
    num: int = Body(5)
):
    keywords = keywords[0].split(",")  # Assuming keywords is sent as a single comma-separated string in a list
    res = Recommendation.get_recommendations_by_keywords(keywords, num)
    dtr = []
    for r in res:
        dtr.append({
            "uid": r["uid"],
            "url": r["url"],
            "title": r["title"],
            "keywords": r["keywords"],
            "picture": r["picture"],
            "description": r["description"]
        })
    return dtr


@app.post("/recommend_by_uid_url")
# async def recommend_by_uid_url(uid: str = None, url: str = None, num: int = 5):
async def recommend_by_uid_url(
        uid: str = Body(...),
        url: str = Body(...),
        num: int = Body(5)
):
    url = url_normalize(url)
    res = Recommendation.get_recommendations_by_uid_url(uid, url, num)
    dtr = []
    for r in res:
        dtr.append({
            "uid": r["uid"],
            "url": r["url"],
            "title": r["title"],
            "keywords": r["keywords"],
            "picture": r["picture"],
            "description": r["description"]
        })
    return dtr


@app.get("/get_all_tags")
async def get_all_tags():
    res = monConnector.get_all_tags()
    dtr = []
    for r in res:
        dtr.append({
            "uid": r["uid"],
            "url": r["url"],
            "title": r["title"],
            "keywords": r["keywords"],
            "picture": r["picture"],
            "description": r["description"]
        })
    return dtr


@app.get("/get_tags_by_uid")
async def get_tags_by_uid(uid: str = None):
    res = monConnector.get_tags_by_uid(uid)
    dtr = []
    for r in res:
        dtr.append({
            "uid": r["uid"],
            "url": r["url"],
            "title": r["title"],
            "keywords": r["keywords"],
            "picture": r["picture"],
            "description": r["description"]
        })
    return dtr


@app.get("/recommend_by_url")
async def recommend_by_url(url: str = None, num: int = 5):
    # url = url_normalize(url)
    res = Recommendation.get_recommendations_by_url(url, num)
    if not res:
        return {"Message:": "Operation failed"}
    dtr = []
    for r in res:
        dtr.append({
            "uid": r["uid"],
            "url": r["url"],
            "title": r["title"],
            "keywords": r["keywords"],
            "picture": r["picture"],
            "description": r["description"]
        })
    return dtr
# endregion
# region Test
@app.post("/test")
async def test(uid: str = None, lst: list[str] = None, picture: UploadFile = File(...), description: str = None):
    print("boop")
    b = await picture.read()
    return {"uid": uid, "lst": lst, "description": description}
    # return Response(content=b, media_type="image/jpeg")
# endregion