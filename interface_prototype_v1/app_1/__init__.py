from flask import Flask
from flask_socketio import SocketIO, emit, join_room, leave_room, close_room, rooms, disconnect

app = Flask(__name__)
socketio = SocketIO(app)

from app_1 import views
