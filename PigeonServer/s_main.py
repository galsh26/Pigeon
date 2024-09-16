# region external functions
import base64
import datetime
import json
from typing import Optional, List

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Response, Form, Body, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
import jwt

import auth
from auth import get_current_user, get_password_hash
import baseDbConnector
import mongoDbConnector
import Recommendation
from normalize_url import url_normalize

# endregion
# region setup
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Secret key for encoding and decoding the JWT token
SECRET_KEY = 'Hippopotomonstrosesquippedaliophobia'


class User(BaseModel):
    username: str
    password: str

class TokenData(BaseModel):
    username: Optional[str] = None

#endregion
# region authentication
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1, minutes=0),
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

@app.get("/users/me")
async def read_users_me(username: str = Depends(verify_token)):
    res = monConnector.get_user(username)
    res = res["uname"]
    return {"username": res}


@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = monConnector.get_user(form_data.username)  # Assuming you have a function that retrieves a user by username
    if user is None:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not auth.verify_password(form_data.password, user["hash_pass"]):  # Assuming the user's password is stored
        # under the "password" key
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    return {"access_token": generate_token(form_data.username), "token_type": "bearer"}



#logout method
blacklisted_tokens = set()


def blacklist_token(token: str):
    blacklisted_tokens.add(token)


@app.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    blacklist_token(token)
    return {"detail": "Logged out successfully"}
# endregion
# region User CRUD


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


@app.get("/user")
async def get_user(uid: str = Depends(verify_token)):
    user = monConnector.get_user(uid)
    if user is None:
        return "User not found."
    return {
        "email": user["_id"],
        "uname": user["uname"]
    }
@app.delete("/user")
async def delete_user(form_data: OAuth2PasswordRequestForm = Depends()):
    email = form_data.username
    password = form_data.password
    monConnector.remove_user(email, password)
    return "User id: " + email + " successfully removed."

# NOW WORKING!
@app.put("/user")
async def update_user(
        uid: str = Depends(verify_token),
        cur_password: str = Form(None),
        n_uname: str = Form(None),
        n_password: str = Form(None)
):
    user = monConnector.get_user(uid)
    if user is None:
        return "User not found."
    if not auth.verify_password(cur_password, user["hash_pass"]):
        return "Wrong password."
    # get current user data
    form_data = User(username=uid, password=cur_password)
    email = form_data.username
    password = form_data.password
    n_password = get_password_hash(n_password)
    if not monConnector.edit_user(email, n_uname, password, n_password):
        return "Failed to update user."
    return "User id: " + email + " successfully updated."

# endregion
# region Tagging CRUD
@app.post("/tag")
async def create_tag(
    uid: str = Depends(verify_token),
    url: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None),
    picture: UploadFile = File(...),
    description: Optional[str] = Form(None)
):
    url = url_normalize(url)
    keywords = keywords.split(',')
    keywords = [keyword.strip() for keyword in keywords]
    # scan each keyword, if it starts with ' +' or ' >', remove it
    # keywords to lower case
    keywords = [keyword.lower() for keyword in keywords]
    # remove the '+ ' or '> ' from the beginning of each keyword
    keywords = [keyword[2:] if keyword.startswith('+ ') or keyword.startswith('> ') else keyword for keyword in keywords]

    try:
        data = await picture.read()
        if not monConnector.create_tag(uid, url, title, keywords, data, description):
            return {"message": "Failed to add tag"}

    except baseDbConnector.DbOperationFailedException as e:
        return {"message": "Failed to add tag"}
    return {"message": "Successfully added search"}


@app.put("/tag")
async def update_tag(
    uid: str = Depends(verify_token),
    url: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None),
    picture: Optional[UploadFile] = File(None),  # Make picture optional
    description: Optional[str] = Form(None)
):
    keywords = keywords.split(',') if keywords else []
    keywords = [keyword.strip() for keyword in keywords]
    url = url_normalize(url)

    pic_data = await picture.read() if picture else None

    monConnector.update_tag(uid, url, title, keywords, pic_data, description)
    return {"message": "Tag successfully updated."}


@app.get("/user-all-tags")
async def get_all_user_tags(uid: str = Depends(verify_token)):
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
    dtr.reverse()
    return dtr


@app.get("/tag")
async def get_tag(uid: str = Depends(verify_token), url: Optional[str] = Query(None)):
    url = url_normalize(url)
    res = monConnector.get_tag(uid, url)

    if not res:
        return {"Message:": "Operation failed"}
    return {
        "uid": res["uid"],
        "url": res["url"],
        "title": res["title"],
        "keywords": res["keywords"],
        "picture": res["picture"],
        "description": res["description"]
    }


@app.delete("/tag")
async def delete_tag(uid: str = Depends(verify_token), url: Optional[str] = Form(None)):
    url = url_normalize(url)
    monConnector.remove_tag(uid, url)
    return "Tag successfully removed."


@app.put("/keyword")
async def add_keywords(
    uid: str = Depends(verify_token),
    url: str = Body(...),
    keywords: list[str] = Form(...)
):
    url = url_normalize(url)
    keywords = keywords[0].split(",")  # Assuming keywords is sent as a single comma-separated string in a list
    keywords = [keyword.strip() for keyword in keywords]
    monConnector.add_keywords(uid, url, keywords)
    return {"message": "Keywords successfully added."}


@app.delete("/keyword")
async def delete_keywords(
    uid: str = Depends(verify_token),
    url: str = Form(...),
    keywords: list[str] = Form(...)
):
    url = url_normalize(url)
    keywords = keywords[0].split(",")  # Assuming keywords is sent as a single comma-separated string in a list
    keywords = [keyword.strip() for keyword in keywords]
    monConnector.remove_keyword(uid, url, keywords)
    return {"message": "Keywords successfully removed."}


@app.get("/all-keyword")
async def get_all_user_keywords(
        uid: str = Depends(verify_token)
):
    res = monConnector.get_all_user_keywords(uid)
    # remove duplicates
    res = list(set(res))
    return res

# endregion
# region Recommendation


@app.post("/recommend_by_kw")
async def recommend_by_keywords(
    keywords: list[str] = Body(...),
    num: int = Body(5)
):
    keywords = keywords[0].split(",")  # Assuming keywords is sent as a single comma-separated string in a list
    keywords = [keyword.strip() for keyword in keywords]
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


@app.post("/recommend_by_url")
# async def recommend_by_uid_url(uid: str = None, url: str = None, num: int = 5):
async def recommend_by_url(
        uid: str = Depends(verify_token),
        url: str = Form(...),
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


@app.get("/recommend_by_url_non_user_related")
async def recommend_by_url_non_user_related(url: str = None, num: int = 5):
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


# TODO: Implement this
@app.get("/generate-keywords-for-url")
async def generate_keywords_for_url(uid: str = Depends(verify_token), url: str = None, num: int = 5):
    # get tab title for url

    all_tags = monConnector.get_all_user_keywords(uid)
    res = Recommendation.get_most_similar_user_keywords(url, all_tags, 3)  # Recommendation.generate_keywords_for_url(url, num * 2)["keywords"]
    # remove any word with only digits in it or 2 or less long words, and remove duplicates
    # WHY?!
    # res = list(filter(lambda x: not x.isdigit() and len(x) > 2, res))
    res2 = Recommendation.generate_keywords_for_url(url, 10)  # Recommendation.get_most_similar_user_keywords(res, monConnector.get_all_user_keywords(uid), 2)
    # strip both res and res2
    res = list(map(lambda x: x.strip(), res))
    res2 = list(map(lambda x: x.strip(), res2))
    # if there is a keyword in res2 that is in res, remove it from res2
    res2 = list(filter(lambda x: x not in res, res2))
    # add ' +' to the beginning of each keyword
    res = list(map(lambda x: "> " + x, res))
    # add ' >' to the beginning of each keyword
    res2 = list(map(lambda x: "+ " + x, res2))
    res = res[:num]
    print(res2)
    res = res + res2
    # res2 = Recommendation.extract_topics(url, num)
    # set res2 at the beginning of res["keywords"] and remove duplicates
    # res["keywords"] = list(set(res2 + res["keywords"]))
    return res


@app.get("/generate-summarize-for-url")
async def generate_summarize_for_website(url: str = None, sentences_num: int = 1):
    res = Recommendation.gen_url_sum(url, sentences_num)
    res = res.strip()
    return {"summary": res}


@app.get("/recommendation-for-current-url")
async def recommendation_for_current_url(uid: str = Depends(verify_token), url: str = None, num: int = 10):
    kw = Recommendation.generate_keywords_for_url(url, num + 1)
    res = Recommendation.get_recommendations_by_keywords(kw, num)
    # if has the same url, remove it
    res = list(filter(lambda x: x["url"] != url, res))
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














































if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
