import base64
import sys

import pymongo.cursor
from fastapi import UploadFile
from pymongo.results import UpdateResult

import auth
from baseDbConnector import *
from pymongo import MongoClient


def encode_img_to_utf8(img):
    return base64.b64encode(img).decode('utf-8')


class MongoDbConnector(BaseDbConnector):
    def __init__(self):
        super().__init__()
        self.client = None
        self.db_name = "Pigeon"
        self.db = None

    def connect(self):
        try:
            self.client = MongoClient("mongodb://127.0.0.1:27017/")
            self.db = self.client[self.db_name]
        except Exception as e:
            return False
        print(f"Connecting to {self.db_name} MongoDB")
        return True

    def close(self):
        try:
            self.client.close()
        except Exception as e:
            return False
        print(f"Closing {self.db_name} MongoDB connection")
        return True


    def add_user(self, email: str, uname: str, password: str):
        try:
            print(self.db["users"])
            res = self.db["users"].insert_one({"_id": email, "uname": uname, "pass": password})
            pass
        except Exception as e:
            print("error: ", e)
            return False
        print("Q RESULT:", res)
        print(f"Adding user to {self.db_name} MongoDB")
        return True


    def register_user(self, email: str, uname: str, hashed_password: str):
        try:
            print(self.db["users"])
            res = self.db["users"].insert_one({"_id": email, "uname": uname, "hash_pass": hashed_password})
            pass
        except Exception as e:
            print("error: ", e)
            return False
        print("Q RESULT:", res)
        print(f"Adding user to {self.db_name} MongoDB")
        return True


    def remove_user(self, email: str, password: str):
        try:
            res: list = list(self.db["users"].find({"_id": email}))
            if len(res) == 0:
                return "User id: ", email, " not found."
        except Exception as e:
            print(e)
            return False
        item: dict = res[0]
        try:
            if not auth.verify_password(password, item["hash_pass"]):
                print("remove failed, pass incorrect")
                return False
        except:
            pass
        try:
            if item["pass"] != password:
                print("remove failed, pass incorrect")
                return False
        except:
            pass
        print(f"Removing user from {self.db_name} MongoDB")
        try:
            delete_res = self.db["users"].delete_one({"_id": email})
            if delete_res.deleted_count == 0:
                return f"Failed to remove user {email}."
        except Exception as e:
            print(e)
            return False
        return "User ", email, " was removed from system!"

    def edit_user(self, email: str, n_uname: str, password: str, n_password: str):
        try:
            res: list = list(self.db["users"].find({"_id": email}))
            if len(res) == 0:
                return "User id: ", email, " not found."
        except Exception as e:
            print(e)
            return False
        item: dict = res[0]
        try:
            if item["pass"] != password:
                print("edit failed, pass incorrect")
                return False
        except:
            pass
        try:
            b = auth.verify_password(password, item["hash_pass"])
            if not b:
                print("edit failed, pass incorrect")
                return False
        except:
            pass
        print(f"Updating user from {self.db_name} MongoDB")
        try:
            update_res: UpdateResult = self.db["users"].update_one({"_id": email},
                                                                   {"$set": {"uname": n_uname, "hash_pass": n_password}})
            print(update_res)
            # check if update was successful
            if update_res.matched_count == 0:
                return f"Failed to remove user {email}."
        except Exception as e:
            print(e)
            return False
        return "User ", email, " was updated!"

    def create_tag(self, uid: str, url: str, title: str, keywords: list, picture: bytes, description: str):
        try:
            # Check if tag already exists
            res: list = list(self.db["taggings"].find({"uid": uid, "url": url}))
            if len(res) != 0:
                return "Tag already exists."
            # Insert the new tag with picture and description
            res = self.db["taggings"].insert_one({
                "uid": uid,
                "url": url,
                "title": title,
                "keywords": keywords,
                "picture": picture,
                "description": description
            })
        except Exception as e:
            return False
        print(f"Adding tag to {self.db_name} MongoDB")
        return res

    def remove_tag(self, uid: str, url: str):
        try:
            res: list = list(self.db["taggings"].find({"uid": uid, "url": url}))
            if len(res) == 0:
                return "Tag not found."
        except Exception as e:
            print(e)
            return False
        print(f"Removing tag from {self.db_name} MongoDB")
        try:
            delete_res = self.db["taggings"].delete_one({"uid": uid, "url": url})
            if delete_res.deleted_count == 0:
                return f"Failed to remove tag."
        except Exception as e:
            print(e)
            return False
        return "Tag was removed from system!"

    def add_keywords(self, uid: str, url: str, keywords: list):
        try:
            res: list = list(self.db["taggings"].find({"uid": uid, "url": url}))
            if len(res) == 0:
                return "Tag not found."
        except Exception as e:
            print(e)
            return False
        print(f"Adding keyword to tag in {self.db_name} MongoDB")
        try:
            #check if keyword is already in tag
            for kw in keywords:
                if kw in res[0]["keywords"]:
                    print("Keyword already in tag.")
                    continue
                update_res: UpdateResult = self.db["taggings"].update_one({"uid": uid, "url": url},
                                                                       {"$push": {"keywords": kw}})
                print(update_res)
            # check if update was successful
                if update_res.matched_count == 0:
                    print(f"Failed to add keyword to tag.")
        except Exception as e:
            print(e)
            return False
        return "Keyword was added to tag!"

    def remove_keyword(self, uid, url, keywords):
        try:
            res: list = list(self.db["taggings"].find({"uid": uid, "url": url}))
            if len(res) == 0:
                return "Tag not found."
        except Exception as e:
            print(e)
            return False
        print(f"Removing keyword from tag in {self.db_name} MongoDB")
        try:
            #check if keyword is already in tag
            for kw in keywords:
                if kw not in res[0]["keywords"]:
                    print("Keyword not in tag.")
                    continue
                # remove keyword from tag
                update_res: UpdateResult = self.db["taggings"].update_one({"uid": uid, "url": url},
                                                                          {"$pull": {"keywords": kw}})
                print(update_res)
            # check if update was successful
                if update_res.matched_count == 0:
                    print(f"Failed to remove keyword from tag.")
        except Exception as e:
            print(e)
            return False
        # Check if all keywords were removed
        res = list(self.db["taggings"].find({"uid": uid, "url": url}))
        if len(res[0]["keywords"]) == 0:
            self.remove_tag(uid, url)
            return "Tag was removed from system!"
        return "Keyword was removed from tag!"


    def get_all_user_keywords(self, uid: str):
        try:
            res: pymongo.cursor.Cursor = self.db["taggings"].find({"uid": uid})
            # convert to list
            res = list(res)
            keywords = []
            for r in res:
                keywords.extend(r["keywords"])
            return keywords
        except Exception as e:
            print(e)
            return

    def update_tag(self, uid: str, url: str, n_title: str, img: bytes, description: str):
        try:
            res: list = list(self.db["taggings"].find({"uid": uid, "url": url}))
            if len(res) == 0:
                return "Tag not found."
        except Exception as e:
            print(e)
            return False
        print(f"Updating tag in {self.db_name} MongoDB")
        try:
            update_res: UpdateResult = self.db["taggings"].update_one(
                {"uid": uid, "url": url},
                {"$set": {"title": n_title, "description": description, "picture": img}}
            )
            print(update_res)
            # check if update was successful
            if update_res.matched_count == 0:
                return f"Failed to update tag."
        except Exception as e:
            print(e)
            return False
        return "Tag was updated!"

    def get_tags_by_uid_url(self, uid: str, url: str):
        try:
            res: list = list(self.db["taggings"].find({"uid": uid, "url": url}))
            if len(res) == 0:
                return "Tag not found."
            res[0]["picture"] = encode_img_to_utf8(res[0]["picture"])
            return res[0]
        except Exception as e:
            print(e)
            return False

    def get_tags_by_uid(self, uid: str):
        try:
            res: pymongo.cursor.Cursor = self.db["taggings"].find({"uid": uid})
            # convert to list
            res = list(res)
            for r in res:
                r["picture"] = encode_img_to_utf8(r["picture"])
            return res
        except Exception as e:
            print(e)
            return False


    def get_all_tags(self):
        try:
            res: pymongo.cursor.Cursor = self.db["taggings"].find({})
            # convert to list
            res = list(res)
            for r in res:
                r["picture"] = encode_img_to_utf8(r["picture"])
            return res
        except Exception as e:
            print(e)
            return False

    def get_user(self, email: str):
        try:
            res: list = list(self.db["users"].find({"_id": email}))
            if len(res) == 0:
                return None
            return res[0]
        except Exception as e:
            print(e)
            return False

    def get_all_users(self):
        try:
            res: pymongo.cursor.Cursor = self.db["users"].find({})
            # convert to list
            res = list(res)
            return res
        except Exception as e:
            print(e)
            return False

    def get_tag(self, uid, url):
        try:
            res: list = list(self.db["taggings"].find({"uid": uid, "url": url}))
            if len(res) == 0:
                return "Tag not found."
            res = res[0]
            res["picture"] = encode_img_to_utf8(res["picture"])
            return res
        except Exception as e:
            print(e)
            return False
