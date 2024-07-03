from abc import abstractmethod


class DbOperationFailedException(Exception):
    pass


class BaseDbConnector:
    def __init__(self):
        self.db_name = None
        self.connection = None

    @abstractmethod
    def connect(self):
        pass

    @abstractmethod
    def close(self):
        pass

    @abstractmethod
    def add_user(self, email: str, uname: str, password: str):
        pass

    @abstractmethod
    def remove_user(self, email: str, password: str):
        pass

    @abstractmethod
    def edit_user(self, email: str, uname: str, n_uname: str, password: str, n_password: str):
        pass

    @abstractmethod
    def create_tag(self, uid: str, url: str, title: str, keywords: list):
        pass

    @abstractmethod
    def remove_tag(self, uid: str, url: str):
        pass

    @abstractmethod
    def add_keywords(self, uid: str, url: str, keywords: list):
        pass

    @abstractmethod
    def remove_keyword(self, uid: str, url: str, keyword: list):
        pass
