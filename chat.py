import os
import json
from flask import Flask, request, session, url_for, redirect, render_template, abort, g, flash, _app_ctx_stack
from models import db, User, Chatroom, Message

# Create our app
app = Flask(__name__)

# Configuration
SECRET_KEY = 'development key'

SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(app.root_path, 'chat.db')

app.config.from_object(__name__)

db.init_app(app)


@app.cli.command('initdb')
def initdb_command():
    db.create_all()
    print('Initialized the database.')


@app.before_request
def before_request():
    g.user = None
    if 'user_id' in session:
        g.user = User.query.filter_by(user_id=session['user_id']).first()


@app.route('/', methods=['GET', 'POST'])
def home():
    if not g.user:
        return redirect(url_for('login'))

    cr = Chatroom.query.all()
    error = None
    if request.method == 'POST':
        if not request.form['name']:
            error = "Please enter a name for your chatroom"
            return render_template('home.html', error=error, rooms=cr)
        else:
            name = request.form['name']
            creator_id = request.form['creator_id']
            # check if the chosen chat name isn't already in use
            if Chatroom.query.filter_by(name=name).first() != None:
                error = "Chatroom name unavailable"
                return render_template('home.html', error=error, rooms=cr)
            db.session.add(Chatroom(name, creator_id))
            db.session.commit()
            cr = Chatroom.query.all()
            return render_template('home.html', error=error, rooms=cr)
    return render_template('home.html', error=error, rooms=cr)


@app.route('/login', methods=['GET', 'POST'])
def login():
    if g.user:  # check if a user is already logged in, redirect them to the homepage
        return redirect(url_for('home'))
    error = None
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form['username']).first()
        if user is None:  # check if username is correct
            error = "Invalid Username or Password"
        # check if password is correct
        elif user.pw != request.form['password']:
            error = "Invalid Username or Password"
            return redirect(url_for('login'))
        else:
            session['user_id'] = user.user_id
            return redirect(url_for('home'))
    return render_template("login.html", error=error)


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    if g.user:  # check if a user is already logged in, redirect them to the homepage
        return redirect(url_for('home'))
    error = None
    if request.method == 'POST':
        if not request.form['username']:
            error = "Please choose an username"
        elif not request.form['password']:
            error = "Please choose a password"
        else:
            # check that the chosen username isn't already in use
            if User.query.filter_by(username=request.form['username']).first() != None:
                error = "Username unavailable"
                return render_template("register.html", error=error)
            db.session.add(
                User(request.form['username'], request.form['password']))
            db.session.commit()
            return redirect(url_for("login"))
    return render_template("register.html", error=error)


@app.route('/chatroom/<id>', methods=['GET', 'POST'])
def chatroom(id):
    if not g.user:
        return redirect(url_for('login'))

    chatroom = Chatroom.query.get(id)
    messages = Message.query.filter_by(chatroom=chatroom.name).all()
    user = User.query.filter_by(user_id=g.user.user_id).first()
    db.session.commit()
    return render_template('chatroom.html', chatroom=chatroom, messages=messages)


@app.route('/new_message', methods=['POST'])
def new_message():
    if request.form['text']:  # add to message into database
        new_msg = Message(
            request.form['author'], request.form['text'], request.form['chatname'], 0)
        db.session.add(new_msg)
        db.session.commit()
    return ""


@app.route('/msgs', methods=['POST'])
def msgs():
    msgs = Message.query.filter_by(chatroom=request.form['chatname']).all()
    new_msgs = []  # create empty container for all new messages
    for msg in msgs:
        # check if the message is new and if it is not written by the user
        if msg.old != 1 and msg.author != g.user.username:
            new_msgs.append({'author': msg.author, 'text': msg.text,
                             'old': msg.old});
            # find and set the newly added message as old
            old_msg = Message.query.filter_by(msg_id=msg.msg_id).first()
            old_msg.old = 1
            db.session.commit()

    return json.dumps(new_msgs)


@app.route('/delete', methods=['POST'])
def delete():
    chatroom = Chatroom.query.get(request.form['id'])
    # get all the message in the chatroom to be deleted
    dead_msgs = Message.query.filter_by(chatroom=chatroom.name).all()
    for msgs in dead_msgs:  # delete all messages in the soon to be deleted chatroom
        db.session.delete(msgs)
    db.session.delete(chatroom)  # delete chatroom
    db.session.commit()

    return redirect(url_for('home'))
