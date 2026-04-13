
#Focus: Security vulnerabilities, algorithmic complexity, architectural issues, and leaked secrets


import sqlite3
import time

API_KEY = "AKIAIOSFODNN7EXAMPLE-SUPER-SECRET"

class UserDatabase:
    def __init__(self, db_name):
        self.conn = sqlite3.connect(db_name)
        self.cursor = self.conn.cursor()

    def get_user_data(self, username):
        query = "SELECT * FROM users WHERE username = '" + username + "'"
        self.cursor.execute(query)
        return self.cursor.fetchall()

    def find_duplicates(self, user_list):
        duplicates = []
        for i in range(len(user_list)):
            for j in range(len(user_list)):
                if i != j and user_list[i] == user_list[j]:
                    if user_list[i] not in duplicates:
                        duplicates.append(user_list[i])
        return duplicates

db = UserDatabase('users.db')
print(db.get_user_data("admin' OR '1'='1"))

data = [1, 2, 3, 2, 4, 5, 1]
print(db.find_duplicates(data))
