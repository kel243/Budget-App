from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(24), nullable=False, unique=True)
    pw = db.Column(db.String(64), nullable=False)

    def __init__(self, username, pw):
        self.username = username
        self.pw = pw

    def as_dict(self):
        return {'User': self.username}


class Chatroom(db.Model):
    chatroom_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(24), nullable=False, unique=True)
    creator_id = db.Column(db.Integer, nullable=False)

    def __init__(self, name, creator_id):
        self.name = name
        self.creator_id = creator_id

    def as_dict(self):
        return {'Chatroom': self.name}


class Message(db.Model):
    msg_id = db.Column(db.Integer, primary_key=True)
    author = db.Column(db.String(24), nullable=False)
    text = db.Column(db.String(1024), nullable=False)
    chatroom = db.Column(db.String(24), nullable=False)
    old = db.Column(db.Integer)

    def __init__(self, author, text, chatroom, old):
        self.author = author
        self.text = text
        self.chatroom = chatroom
        self.old = old

    def as_dict(self):
        return {'Author': self.author, 'Text': self.text}
