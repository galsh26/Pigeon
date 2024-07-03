import json

from fastapi import FastAPI

import baseDbConnector
import mongoDbConnector

app = FastAPI()

monConnector: baseDbConnector = mongoDbConnector.MongoDbConnector()
monConnector.connect()


#region User CRUD
@app.post("/user")
async def create_user(user: dict):
    email = user["email"]
    uname = user["uname"]
    password = user["pass"]
    print(f"User {uname} created with email {email}")
    print(f"Password: {password}")
    try:
        monConnector.add_user(email, uname, password)
    except baseDbConnector.DbOperationFailedException as e:
        return {"message": "Failed to add user"}
    return user


@app.delete("/user")
async def delete_user(user_pass: dict):
    email = user_pass["email"]
    password = user_pass["pass"]
    monConnector.remove_user(email, password)
    return "User id: ", email, " successfully removed."


@app.delete("/user")
async def delete_user(user_pass: dict):
    email = user_pass["email"]
    password = user_pass["pass"]
    monConnector.remove_user(email, password)
    return "User id: ", email, " successfully removed."


@app.put("/user")
async def update_user(user: dict):
    email = user["email"]
    uname = user["uname"]
    n_uname = user["n_uname"]
    password = user["pass"]
    n_password = user["n_pass"]
    monConnector.edit_user(email, uname, n_uname, password, n_password)
    return "User id: ", email, " successfully updated."
#endregion


#region Tag CRUD
'''
{
"uid":"a",
"url":"a",
"title":"Abc",
"keywords":["news","America"]
}
'''
@app.post("/tag")
async def create_tag(tag: dict):
    uid = tag["uid"]
    url = tag["url"]
    title = tag["title"]
    keywords = tag["keywords"]
    try:
        monConnector.create_tag(uid, url, title, keywords)
    except baseDbConnector.DbOperationFailedException as e:
        return {"message": "Failed to add search"}
    return tag


'''
{
"uid":"a",
"url":"a",
"title":"Abc",
"keywords": ["America","Conflict","Politics"]
}
'''
@app.put("/tag")
async def update_tag(tag: dict):
    uid = tag["uid"]
    url = tag["url"]
    title = tag["title"]
    n_title = tag["n_title"]
    monConnector.update_tag(uid, url, n_title)
    return "Tag successfully updated."



'''
"uid":"a",
"url":"a"
'''
@app.delete("/tag")
async def delete_tag(tag: dict):
    uid = tag["uid"]
    url = tag["url"]
    monConnector.remove_tag(uid, url)
    return "Tag successfully removed."


'''
{
"uid":"a",
"url":"a",
"keywords": ["America","Conflict","Politics"]
}
'''
@app.put("/keyword")
async def add_keywords(tag: dict):
    uid = tag["uid"]
    url = tag["url"]
    keywords = tag["keywords"]
    monConnector.add_keywords(uid, url, keywords)
    return "Keywords successfully added."

'''
{
"uid":"a",
"url":"a",
"keywords": ["news"]
}
'''
@app.delete("/keyword")
async def delete_keywords(tag: dict):
    uid = tag["uid"]
    url = tag["url"]
    keywords = tag["keywords"]
    monConnector.remove_keyword(uid, url, keywords)
    return "Keywords successfully removed."
#endregion
