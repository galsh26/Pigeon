import sys

import pymongo.cursor
from pymongo.results import UpdateResult

from baseDbConnector import *
from pymongo import MongoClient


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
            sys.exit("Unable to connect to MongoDB")
        print(f"Connecting to {self.db_name} MongoDB")

    def close(self):
        try:
            self.client.close()
        except Exception as e:
            sys.exit("Unable to close MongoDB connection")
        print(f"Closing {self.db_name} MongoDB connection")

    def add_user(self, email: str, uname: str, password: str):
        try:
            print(self.db["users"])
            res = self.db["users"].insert_one({"_id": email, "uname": uname, "pass": password})
            pass
        except Exception as e:
            print("Q RESULT:", res)
            raise DbOperationFailedException("Unable to add user to MongoDB")
        print("Q RESULT:", res)
        print(f"Adding user to {self.db_name} MongoDB")

    def remove_user(self, email: str, password: str):
        try:
            res: list = list(self.db["users"].find({"_id": email}))
            if len(res) == 0:
                return "User id: ", email, " not found."
        except Exception as e:
            print(e)
            raise Exception(e)
        item: dict = res[0]
        if item["pass"] != password:
            print("remove failed, pass incorrect")
        print(f"Removing user from {self.db_name} MongoDB")
        try:
            delete_res = self.db["users"].delete_one({"_id": email})
            if delete_res.deleted_count == 0:
                return f"Failed to remove user {email}."
        except Exception as e:
            print(e)
            raise Exception(e)
        return "User ", email, " was removed from system!"

    def edit_user(self, email: str, uname: str, n_uname: str, password: str, n_password: str):
        try:
            res: list = list(self.db["users"].find({"_id": email}))
            if len(res) == 0:
                return "User id: ", email, " not found."
        except Exception as e:
            print(e)
            raise Exception(e)
        item: dict = res[0]
        if item["pass"] != password:
            print("remove failed, pass incorrect")
        print(f"Updating user from {self.db_name} MongoDB")
        try:
            update_res: UpdateResult = self.db["users"].update_one({"_id": email},
                                                                   {"$set": {"uname": n_uname, "pass": n_password}})
            print(update_res)
            # check if update was successful
            if update_res.matched_count == 0:
                return f"Failed to remove user {email}."
        except Exception as e:
            print(e)
            raise Exception(e)
        return "User ", email, " was updated!"

    def create_tag(self, uid: str, url: str, title: str, keywords: list):
        try:
            #check if tag already exists
            res: list = list(self.db["taggings"].find({"uid": uid, "url": url}))
            if len(res) != 0:
                return "Tag already exists."
            res = self.db["taggings"].insert_one({"uid": uid, "url": url, "title": title, "keywords": keywords})
        except Exception as e:
            raise DbOperationFailedException("Unable to add tag to MongoDB")
        print(f"Adding tag to {self.db_name} MongoDB")
        return res

    def remove_tag(self, uid: str, url: str):
        try:
            res: list = list(self.db["taggings"].find({"uid": uid, "url": url}))
            if len(res) == 0:
                return "Tag not found."
        except Exception as e:
            print(e)
            raise Exception(e)
        print(f"Removing tag from {self.db_name} MongoDB")
        try:
            delete_res = self.db["taggings"].delete_one({"uid": uid, "url": url})
            if delete_res.deleted_count == 0:
                return f"Failed to remove tag."
        except Exception as e:
            print(e)
            raise Exception(e)
        return "Tag was removed from system!"

    def add_keywords(self, uid: str, url: str, keywords: list):
        try:
            res: list = list(self.db["taggings"].find({"uid": uid, "url": url}))
            if len(res) == 0:
                return "Tag not found."
        except Exception as e:
            print(e)
            raise Exception(e)
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
            raise Exception(e)
        return "Keyword was added to tag!"

    def remove_keyword(self, uid, url, keywords):
        try:
            res: list = list(self.db["taggings"].find({"uid": uid, "url": url}))
            if len(res) == 0:
                return "Tag not found."
        except Exception as e:
            print(e)
            raise Exception(e)
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
            raise Exception(e)
        # Check if all keywords were removed
        res = list(self.db["taggings"].find({"uid": uid, "url": url}))
        if len(res[0]["keywords"]) == 0:
            self.remove_tag(uid, url)
            return "Tag was removed from system!"
        return "Keyword was removed from tag!"

    def update_tag(self, uid: str, url: str, n_title: str):
        try:
            res: list = list(self.db["taggings"].find({"uid": uid, "url": url}))
            if len(res) == 0:
                return "Tag not found."
        except Exception as e:
            print(e)
            raise Exception(e)
        print(f"Updating tag in {self.db_name} MongoDB")
        try:
            update_res: UpdateResult = self.db["taggings"].update_one({"uid": uid, "url": url},
                                                                      {"$set": {"title": n_title}})
            print(update_res)
            # check if update was successful
            if update_res.matched_count == 0:
                return f"Failed to update tag."
        except Exception as e:
            print(e)
            raise Exception(e)
        return "Tag was updated!"
