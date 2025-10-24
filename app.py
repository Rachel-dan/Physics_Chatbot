
# from flask import Flask, render_template, request, jsonify, redirect, url_for
# from flask_sqlalchemy import SQLAlchemy
# from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
# from werkzeug.security import generate_password_hash, check_password_hash
# import google.generativeai as genai
# import assemblyai as aai
# import os
# from datetime import datetime, timedelta
# from functools import wraps
# from sqlalchemy import func

# # --- App Initialization, DB Config, Secret Key ---
# app = Flask(__name__)
# basedir = os.path.abspath(os.path.dirname(__file__))
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'chatbot.db')
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# app.config['SECRET_KEY'] = 'a-super-secret-key-that-you-should-change'
# db = SQLAlchemy(app)

# SESSION_TIMEOUT = timedelta(minutes=30)

# # --- Login Manager Setup ---
# login_manager = LoginManager()
# login_manager.init_app(app)
# login_manager.login_view = 'index'
# login_manager.unauthorized_handler(lambda: (jsonify({'error': 'Unauthorized'}), 401))


# # --- Database Models ---
# class User(UserMixin, db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     username = db.Column(db.String(100), unique=True, nullable=False)
#     password_hash = db.Column(db.String(200), nullable=False)
#     chats = db.relationship('Chat', backref='owner', lazy=True, cascade="all, delete-orphan")
#     is_admin = db.Column(db.Boolean, default=False, nullable=False)
#     sessions = db.relationship('UserSession', backref='user', lazy=True, cascade="all, delete-orphan")

#     def set_password(self, password):
#         self.password_hash = generate_password_hash(password)

#     def check_password(self, password):
#         return check_password_hash(self.password_hash, password)

# class Chat(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     title = db.Column(db.String(100), nullable=False)
#     user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
#     messages = db.relationship('Message', backref='chat', lazy=True, cascade="all, delete-orphan")

# class Message(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     role = db.Column(db.String(10), nullable=False)
#     content = db.Column(db.Text, nullable=False)
#     chat_id = db.Column(db.Integer, db.ForeignKey('chat.id'), nullable=False)
#     feedback = db.Column(db.Integer, default=0)
#     timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

# class UserSession(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
#     start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
#     end_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

#     @property
#     def duration(self):
#         return self.end_time - self.start_time

# # --- User Loader ---
# @login_manager.user_loader
# def load_user(user_id):
#     return User.query.get(int(user_id))

# # +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# # --- PROMPT ENGINEERING: DEFINE PERSONA, RULES, AND EXAMPLES ---
# # +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# FEW_SHOT_EXAMPLES = """
# Here are some examples of high-quality interactions:

# Example 1:
# Student: What is momentum?
# Tutor: Of course! Momentum is often called "mass in motion." It's a fundamental concept that measures how hard it is to stop a moving object. The formula is p = mv, where 'p' is momentum, 'm' is the mass of the object, and 'v' is its velocity. For example, a heavy truck moving slowly can have the same momentum as a fast-moving baseball!

# Example 2:
# Student: Tell me about black holes.
# Tutor: A fascinating topic! A black hole is a region in spacetime where gravity is so incredibly strong that nothing, not even light, can escape from it. It's formed when a very massive star collapses at the end of its life. The boundary of a black hole is called the event horizon – it's famously known as the "point of no return."
# """

# # This combines the persona, rules, and few-shot examples into a single system prompt.
# # It is sent to the model but is NOT saved in our database and is NOT seen by the user.
# SYSTEM_PROMPT = {
#     "role": "user",
#     "parts": [{
#         "text": f"""You are Dr. Anya Sharma, an expert AI Physics Tutor. Your personality is encouraging, patient, and extremely knowledgeable. Your primary goals are:
#         1.  Answer physics questions accurately and clearly.
#         2.  Break down complex topics into simple, easy-to-understand concepts. Use analogies and real-world examples where helpful.
#         3.  If a user asks a question that is completely unrelated to physics, mathematics, or science (e.g., about politics, celebrities, or personal opinions), you must politely decline to answer and guide them back to the topic. For example, say: "As an AI Physics Tutor, my expertise is focused on science. I'd be happy to help with any physics questions you have!"
#         4.  Keep your answers concise and focused on the user's question.
#         When a student asks a question that requires a calculation or a logical deduction, you must follow these steps:
#         1.  First, think step-by-step to break down the problem. Identify the knowns and the unknowns.
#         2.  State the relevant formula or principle.
#         3.  Show the calculation or logical steps clearly.
#         4.  Finally, state the final answer in a clear, concluding sentence.

#         {FEW_SHOT_EXAMPLES}

#         Now, please begin the conversation and answer the student's first question.
#         """
#     }]
# }
# # +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

# # --- API Config & Admin Creation ---
# GEMINI_API_KEY = "AIzaSyBJfSM9YkZ3jtZSqjfhfj9uLdePCGLG_Ao" 
# ASSEMBLYAI_API_KEY = "bc8fa7f52e9c45bb9a94ffeab846867d"

# try:
#     genai.configure(api_key=GEMINI_API_KEY)
#     gemini_model = genai.GenerativeModel('models/gemini-pro-latest')
#     aai.settings.api_key = ASSEMBLYAI_API_KEY
#     print("Models loaded successfully.")
# except Exception as e:
#     print(f"Error during API configuration: {e}")

# def create_admin_user_if_not_exists():
#     admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
#     admin_password = os.environ.get('ADMIN_PASSWORD', 'adminpassword')
#     if not User.query.filter_by(username=admin_username).first():
#         print(f"Creating default admin user: {admin_username}")
#         admin_user = User(username=admin_username, is_admin=True)
#         admin_user.set_password(admin_password)
#         db.session.add(admin_user)
#         db.session.commit()
#         print("Admin user created successfully.")


# # --- Session Management Helper Function ---
# def update_user_session(user_id):
#     now = datetime.utcnow()
#     last_session = UserSession.query.filter_by(user_id=user_id).order_by(UserSession.start_time.desc()).first()
#     if last_session and (now - last_session.end_time < SESSION_TIMEOUT):
#         last_session.end_time = now
#     else:
#         new_session = UserSession(user_id=user_id, start_time=now, end_time=now)
#         db.session.add(new_session)
#     db.session.commit()


# # --- Application Routes ---
# @app.route('/')
# def index():
#     return render_template('index.html')

# # --- ADMIN DASHBOARD ROUTES ---
# def admin_required(f):
#     @wraps(f)
#     @login_required
#     def decorated_function(*args, **kwargs):
#         if not current_user.is_admin:
#             return redirect(url_for('index'))
#         return f(*args, **kwargs)
#     return decorated_function


# @app.route('/admin')
# @admin_required
# def admin_dashboard():
#     return render_template('admin.html')


# @app.route('/api/admin/stats')
# @admin_required
# def get_admin_stats():
#     total_users = User.query.count()
#     total_chats = Chat.query.count()
#     total_messages = Message.query.count()
#     now = datetime.utcnow()
#     daily_active = db.session.query(func.count(db.distinct(UserSession.user_id))).\
#         filter(UserSession.end_time >= now - timedelta(days=1)).scalar()
#     weekly_active = db.session.query(func.count(db.distinct(UserSession.user_id))).\
#         filter(UserSession.end_time >= now - timedelta(weeks=1)).scalar()
#     monthly_active = db.session.query(func.count(db.distinct(UserSession.user_id))).\
#         filter(UserSession.end_time >= now - timedelta(days=30)).scalar()
#     positive_feedback = Message.query.filter_by(feedback=1).count()
#     total_feedback = Message.query.filter(Message.feedback != 0).count()
#     satisfaction_rate = (positive_feedback / total_feedback * 100) if total_feedback > 0 else 0
#     return jsonify({
#         'total_users': total_users, 'total_conversations': total_chats, 'total_messages': total_messages,
#         'active_users': {'daily': daily_active, 'weekly': weekly_active, 'monthly': monthly_active},
#         'satisfaction_rate': round(satisfaction_rate, 2)
#     })

# @app.route('/api/admin/analytics')
# @admin_required
# def get_admin_analytics():
#     sessions = UserSession.query.all()
#     total_duration_seconds = sum((s.duration.total_seconds() for s in sessions))
#     avg_duration_seconds = total_duration_seconds / len(sessions) if sessions else 0
#     seven_days_ago = datetime.utcnow().date() - timedelta(days=6)
#     message_activity = db.session.query(
#         func.date(Message.timestamp), func.count(Message.id)
#     ).filter(func.date(Message.timestamp) >= seven_days_ago).group_by(func.date(Message.timestamp)).all()
#     activity_dict = { (seven_days_ago + timedelta(days=i)).strftime('%Y-%m-%d'): 0 for i in range(7) }
#     for date_str, count in message_activity:
#         if date_str in activity_dict:
#             activity_dict[date_str] = count
#     sorted_activity = sorted(activity_dict.items())
#     activity_labels = [datetime.strptime(date_str, '%Y-%m-%d').strftime('%b %d') for date_str, count in sorted_activity]
#     activity_data = [count for date_str, count in sorted_activity]
#     durations_in_minutes = [s.duration.total_seconds() / 60 for s in sessions]
#     bins = {
#         "< 1 min": sum(1 for d in durations_in_minutes if d < 1), "1-5 mins": sum(1 for d in durations_in_minutes if 1 <= d < 5),
#         "5-15 mins": sum(1 for d in durations_in_minutes if 5 <= d < 15), "15-30 mins": sum(1 for d in durations_in_minutes if 15 <= d < 30),
#         "30+ mins": sum(1 for d in durations_in_minutes if d >= 30),
#     }
#     top_users_data = db.session.query(
#         User.username,
#         func.sum(func.strftime('%s', UserSession.end_time) - func.strftime('%s', UserSession.start_time)).label('total_duration')
#     ).join(User, User.id == UserSession.user_id).group_by(User.id).order_by(func.sum(
#             func.strftime('%s', UserSession.end_time) - func.strftime('%s', UserSession.start_time)
#         ).desc()).limit(5).all()
#     top_users = [{'username': username, 'total_time_seconds': duration} for username, duration in top_users_data if duration]
#     return jsonify({
#         'average_session_duration_seconds': round(avg_duration_seconds),
#         'chat_activity': {'labels': activity_labels, 'data': activity_data},
#         'session_length_distribution': {'labels': list(bins.keys()), 'data': list(bins.values())},
#         'top_active_users': top_users
#     })


# # --- AUTH AND CHAT ROUTES ---
# @app.route('/register', methods=['POST'])
# def register():
#     data = request.get_json()
#     username, password = data.get('username'), data.get('password')
#     if User.query.filter_by(username=username).first():
#         return jsonify({'error': 'Username already exists.'}), 409
#     new_user = User(username=username)
#     new_user.set_password(password)
#     db.session.add(new_user)
#     db.session.commit()
#     login_user(new_user)
#     return jsonify({'message': 'Registration successful.', 'is_admin': new_user.is_admin}), 201

# @app.route('/login', methods=['POST'])
# def login():
#     data = request.get_json()
#     username, password = data.get('username'), data.get('password')
#     user = User.query.filter_by(username=username).first()
#     if user and user.check_password(password):
#         login_user(user)
#         return jsonify({'message': 'Login successful.', 'is_admin': user.is_admin}), 200
#     return jsonify({'error': 'Invalid credentials.'}), 401

# @app.route('/logout')
# @login_required
# def logout():
#     logout_user()
#     return jsonify({'message': 'Logged out successfully.'})

# @app.route('/ask', methods=['POST'])
# @login_required
# def ask():
#     update_user_session(current_user.id)
#     data = request.get_json()
#     user_message_text = data.get('message')
#     chat_id = data.get('chat_id')
#     if not user_message_text:
#         return jsonify({'error': 'No message provided.'}), 400
#     try:
#         current_chat = None
#         if not chat_id:
#             title = user_message_text[:40] + '...' if len(user_message_text) > 40 else user_message_text
#             new_chat = Chat(title=title, user_id=current_user.id)
#             db.session.add(new_chat)
#             db.session.commit()
#             chat_id = new_chat.id
#             current_chat = new_chat
#         else:
#             current_chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first_or_404()
        
#         # We save the user's raw message to our database as before
#         user_message = Message(role='user', content=user_message_text, chat_id=chat_id)
#         db.session.add(user_message)
#         db.session.commit()

#         # --- PROMPT ENGINEERING LOGIC INSERTED HERE ---
#         # 1. Get the normal chat history from our database
#         history_from_db = [{"role": msg.role, "parts": [{"text": msg.content}]} for msg in current_chat.messages]

#         # 2. Create the prompt for the model by combining our System Prompt with the actual chat history
#         #    If the chat is new, this will be the system prompt followed by the user's first question.
#         full_history_for_model = [SYSTEM_PROMPT] + history_from_db
#         # --- END OF PROMPT ENGINEERING LOGIC ---
        
#         # Use the engineered prompt to start the chat session
#         chat_session = gemini_model.start_chat(history=full_history_for_model[:-1])
#         response = chat_session.send_message(full_history_for_model[-1]['parts'])
#         bot_response_text = response.text
        
#         bot_message = Message(role='model', content=bot_response_text, chat_id=chat_id)
#         db.session.add(bot_message)
#         db.session.commit()
        
#         return jsonify({
#             'response': bot_response_text, 'chat_id': chat_id, 'title': current_chat.title,
#             'bot_message_id': bot_message.id 
#         })
#     except Exception as e:
#         print(f"Error in /ask endpoint: {e}")
#         db.session.rollback()
#         return jsonify({'error': 'An error occurred.'}), 500

# @app.route('/chats', methods=['GET'])
# @login_required
# def get_chats():
#     chats = Chat.query.filter_by(user_id=current_user.id).order_by(Chat.id.desc()).all()
#     return jsonify([{'id': chat.id, 'title': chat.title} for chat in chats])

# @app.route('/chats/<int:chat_id>', methods=['GET'])
# @login_required
# def get_chat_history(chat_id):
#     chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first_or_404()
#     messages = [{'id': msg.id, 'role': msg.role, 'content': msg.content} for msg in chat.messages]
#     return jsonify(messages)

# @app.route('/rename_chat/<int:chat_id>', methods=['POST'])
# @login_required
# def rename_chat(chat_id):
#     data = request.get_json()
#     new_title = data.get('title')
#     if not new_title:
#         return jsonify({'error': 'New title is required.'}), 400
#     chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first_or_404()
#     chat.title = new_title
#     db.session.commit()
#     return jsonify({'message': 'Chat renamed successfully.'})

# @app.route('/feedback', methods=['POST'])
# @login_required
# def feedback():
#     data = request.get_json()
#     message_id, feedback_value = data.get('message_id'), data.get('feedback_value')
#     if not message_id or feedback_value not in [1, -1]:
#         return jsonify({'error': 'Invalid data.'}), 400
#     message = Message.query.join(Chat).filter(
#         Chat.user_id == current_user.id, Message.id == message_id
#     ).first_or_404()
#     message.feedback = feedback_value
#     db.session.commit()
#     return jsonify({'message': 'Feedback received.'})

# @app.route('/transcribe', methods=['POST'])
# def transcribe():
#     audio_file = request.files.get('audio_data')
#     if not audio_file:
#         return jsonify({'error': 'No audio file provided'}), 400
#     transcriber = aai.Transcriber()
#     transcript = transcriber.transcribe(audio_file)
#     if transcript.status == aai.TranscriptStatus.error:
#         return jsonify({'error': transcript.error}), 500
#     else:
#         return jsonify({'transcription': transcript.text})

# if __name__ == '__main__':
#     with app.app_context():
#         db.create_all()
#         create_admin_user_if_not_exists()
#     app.run(host='0.0.0.0', port=5000, debug=True)












































from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import google.generativeai as genai
import assemblyai as aai
import os
from datetime import datetime, timedelta
from functools import wraps
from sqlalchemy import func
from flask_cors import CORS

# --- App Initialization, DB Config, Secret Key ---
# app = Flask(__name__)
# basedir = os.path.abspath(os.path.dirname(__file__))
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'chatbot.db')
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# app.config['SECRET_KEY'] = 'a-super-secret-key-that-you-should-change'
# db = SQLAlchemy(app)

app = Flask(__name__)

origins = [
    "http://localhost:5000",
    "https://physicschatbot.netlify.app",
    "https://physics-chatbot-frontend.onrender.com"  # <-- Add your new Render frontend URL here
]
CORS(app, origins=origins)

# +++ START NEW DATABASE CONFIG +++
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL or 'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'chatbot.db')
# +++ END NEW DATABASE CONFIG +++
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-super-secret-key-that-you-should-change')
db = SQLAlchemy(app)

SESSION_TIMEOUT = timedelta(minutes=30)

# --- Login Manager Setup ---
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'index'
login_manager.unauthorized_handler(lambda: (jsonify({'error': 'Unauthorized'}), 401))


# --- Database Models ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    chats = db.relationship('Chat', backref='owner', lazy=True, cascade="all, delete-orphan")
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    sessions = db.relationship('UserSession', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    messages = db.relationship('Message', backref='chat', lazy=True, cascade="all, delete-orphan")

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(10), nullable=False)
    content = db.Column(db.Text, nullable=False)
    chat_id = db.Column(db.Integer, db.ForeignKey('chat.id'), nullable=False)
    feedback = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    @property
    def duration(self):
        return self.end_time - self.start_time

# --- User Loader ---
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# --- PROMPT ENGINEERING: DEFINE PERSONA, RULES, AND EXAMPLES ---
# +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
FEW_SHOT_EXAMPLES = """
Here are some examples of high-quality interactions:

Example 1:
Student: What is momentum?
Tutor: Of course! Momentum is often called "mass in motion." It's a fundamental concept that measures how hard it is to stop a moving object. The formula is p = mv, where 'p' is momentum, 'm' is the mass of the object, and 'v' is its velocity. For example, a heavy truck moving slowly can have the same momentum as a fast-moving baseball!

Example 2:
Student: Tell me about black holes.
Tutor: A fascinating topic! A black hole is a region in spacetime where gravity is so incredibly strong that nothing, not even light, can escape from it. It's formed when a very massive star collapses at the end of its life. The boundary of a black hole is called the event horizon – it's famously known as the "point of no return."
"""

# This combines the persona, rules, and few-shot examples into a single system prompt.
# It is sent to the model but is NOT saved in our database and is NOT seen by the user.
SYSTEM_PROMPT = {
    "role": "user",
    "parts": [{
        "text": f"""You are Dr. Anya Sharma, an expert AI Physics Tutor. Your personality is encouraging, patient, and extremely knowledgeable. Your primary goals are:
        1.  Answer physics questions accurately and clearly.
        2.  Break down complex topics into simple, easy-to-understand concepts. Use analogies and real-world examples where helpful.
        3.  If a user asks a question that is completely unrelated to physics, mathematics, or science (e.g., about politics, celebrities, or personal opinions), you must politely decline to answer and guide them back to the topic. For example, say: "As an AI Physics Tutor, my expertise is focused on science. I'd be happy to help with any physics questions you have!"
        4.  Keep your answers concise and focused on the user's question.
        When a student asks a question that requires a calculation or a logical deduction, you must follow these steps:
        1.  First, think step-by-step to break down the problem. Identify the knowns and the unknowns.
        2.  State the relevant formula or principle.
        3.  Show the calculation or logical steps clearly.
        4.  Finally, state the final answer in a clear, concluding sentence.

        {FEW_SHOT_EXAMPLES}

        Now, please begin the conversation and answer the student's first question.
        """
    }]
}
# +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

# --- API Config & Admin Creation ---
GEMINI_API_KEY = "AIzaSyBJfSM9YkZ3jtZSqjfhfj9uLdePCGLG_Ao" 
ASSEMBLYAI_API_KEY = "bc8fa7f52e9c45bb9a94ffeab846867d"

try:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('models/gemini-pro-latest')
    aai.settings.api_key = ASSEMBLYAI_API_KEY
    print("Models loaded successfully.")
except Exception as e:
    print(f"Error during API configuration: {e}")

def create_admin_user_if_not_exists():
    admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'adminpassword')
    if not User.query.filter_by(username=admin_username).first():
        print(f"Creating default admin user: {admin_username}")
        admin_user = User(username=admin_username, is_admin=True)
        admin_user.set_password(admin_password)
        db.session.add(admin_user)
        db.session.commit()
        print("Admin user created successfully.")


# --- Session Management Helper Function ---
def update_user_session(user_id):
    now = datetime.utcnow()
    last_session = UserSession.query.filter_by(user_id=user_id).order_by(UserSession.start_time.desc()).first()
    if last_session and (now - last_session.end_time < SESSION_TIMEOUT):
        last_session.end_time = now
    else:
        new_session = UserSession(user_id=user_id, start_time=now, end_time=now)
        db.session.add(new_session)
    db.session.commit()


# --- Application Routes ---
@app.route('/api/check_auth')
def check_auth():
    if current_user.is_authenticated:
        return jsonify({
            'logged_in': True,
            'username': current_user.username,
            'is_admin': current_user.is_admin
        })
    else:
        return jsonify({'logged_in': False})

# --- ADMIN DASHBOARD ROUTES ---
def admin_required(f):
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin:
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function


@app.route('/admin')
@admin_required
def admin_dashboard():
    return render_template('admin.html')


@app.route('/api/admin/stats')
@admin_required
def get_admin_stats():
    total_users = User.query.count()
    total_chats = Chat.query.count()
    total_messages = Message.query.count()
    now = datetime.utcnow()
    daily_active = db.session.query(func.count(db.distinct(UserSession.user_id))).\
        filter(UserSession.end_time >= now - timedelta(days=1)).scalar()
    weekly_active = db.session.query(func.count(db.distinct(UserSession.user_id))).\
        filter(UserSession.end_time >= now - timedelta(weeks=1)).scalar()
    monthly_active = db.session.query(func.count(db.distinct(UserSession.user_id))).\
        filter(UserSession.end_time >= now - timedelta(days=30)).scalar()
    positive_feedback = Message.query.filter_by(feedback=1).count()
    total_feedback = Message.query.filter(Message.feedback != 0).count()
    satisfaction_rate = (positive_feedback / total_feedback * 100) if total_feedback > 0 else 0
    return jsonify({
        'total_users': total_users, 'total_conversations': total_chats, 'total_messages': total_messages,
        'active_users': {'daily': daily_active, 'weekly': weekly_active, 'monthly': monthly_active},
        'satisfaction_rate': round(satisfaction_rate, 2)
    })

@app.route('/api/admin/analytics')
@admin_required
def get_admin_analytics():
    sessions = UserSession.query.all()
    total_duration_seconds = sum((s.duration.total_seconds() for s in sessions))
    avg_duration_seconds = total_duration_seconds / len(sessions) if sessions else 0
    seven_days_ago = datetime.utcnow().date() - timedelta(days=6)
    message_activity = db.session.query(
        func.date(Message.timestamp), func.count(Message.id)
    ).filter(func.date(Message.timestamp) >= seven_days_ago).group_by(func.date(Message.timestamp)).all()
    activity_dict = { (seven_days_ago + timedelta(days=i)).strftime('%Y-%m-%d'): 0 for i in range(7) }
    for date_str, count in message_activity:
        if date_str in activity_dict:
            activity_dict[date_str] = count
    sorted_activity = sorted(activity_dict.items())
    activity_labels = [datetime.strptime(date_str, '%Y-%m-%d').strftime('%b %d') for date_str, count in sorted_activity]
    activity_data = [count for date_str, count in sorted_activity]
    durations_in_minutes = [s.duration.total_seconds() / 60 for s in sessions]
    bins = {
        "< 1 min": sum(1 for d in durations_in_minutes if d < 1), "1-5 mins": sum(1 for d in durations_in_minutes if 1 <= d < 5),
        "5-15 mins": sum(1 for d in durations_in_minutes if 5 <= d < 15), "15-30 mins": sum(1 for d in durations_in_minutes if 15 <= d < 30),
        "30+ mins": sum(1 for d in durations_in_minutes if d >= 30),
    }
    top_users_data = db.session.query(
        User.username,
        func.sum(func.strftime('%s', UserSession.end_time) - func.strftime('%s', UserSession.start_time)).label('total_duration')
    ).join(User, User.id == UserSession.user_id).group_by(User.id).order_by(func.sum(
            func.strftime('%s', UserSession.end_time) - func.strftime('%s', UserSession.start_time)
        ).desc()).limit(5).all()
    top_users = [{'username': username, 'total_time_seconds': duration} for username, duration in top_users_data if duration]
    
    # +++ NEW: Query for feedback data +++
    positive_feedback_count = Message.query.filter_by(feedback=1).count()
    negative_feedback_count = Message.query.filter_by(feedback=-1).count()

    return jsonify({
        'average_session_duration_seconds': round(avg_duration_seconds),
        'chat_activity': {'labels': activity_labels, 'data': activity_data},
        'session_length_distribution': {'labels': list(bins.keys()), 'data': list(bins.values())},
        'top_active_users': top_users,
        # +++ NEW: Add feedback data to the response +++
        'feedback_distribution': {
            'labels': ['Positive', 'Negative'],
            'data': [positive_feedback_count, negative_feedback_count]
        }
    })


# --- AUTH AND CHAT ROUTES ---
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username, password = data.get('username'), data.get('password')
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists.'}), 409
    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    login_user(new_user)
    return jsonify({'message': 'Registration successful.', 'is_admin': new_user.is_admin}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username, password = data.get('username'), data.get('password')
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user)
        return jsonify({'message': 'Login successful.', 'is_admin': user.is_admin}), 200
    return jsonify({'error': 'Invalid credentials.'}), 401

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully.'})

@app.route('/ask', methods=['POST'])
@login_required
def ask():
    update_user_session(current_user.id)
    data = request.get_json()
    user_message_text = data.get('message')
    chat_id = data.get('chat_id')
    if not user_message_text:
        return jsonify({'error': 'No message provided.'}), 400
    try:
        current_chat = None
        if not chat_id:
            title = user_message_text[:40] + '...' if len(user_message_text) > 40 else user_message_text
            new_chat = Chat(title=title, user_id=current_user.id)
            db.session.add(new_chat)
            db.session.commit()
            chat_id = new_chat.id
            current_chat = new_chat
        else:
            current_chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first_or_404()
        
        # We save the user's raw message to our database as before
        user_message = Message(role='user', content=user_message_text, chat_id=chat_id)
        db.session.add(user_message)
        db.session.commit()

        # --- PROMPT ENGINEERING LOGIC INSERTED HERE ---
        # 1. Get the normal chat history from our database
        history_from_db = [{"role": msg.role, "parts": [{"text": msg.content}]} for msg in current_chat.messages]

        # 2. Create the prompt for the model by combining our System Prompt with the actual chat history
        #    If the chat is new, this will be the system prompt followed by the user's first question.
        full_history_for_model = [SYSTEM_PROMPT] + history_from_db
        # --- END OF PROMPT ENGINEERING LOGIC ---
        
        # Use the engineered prompt to start the chat session
        chat_session = gemini_model.start_chat(history=full_history_for_model[:-1])
        response = chat_session.send_message(full_history_for_model[-1]['parts'])
        bot_response_text = response.text
        
        bot_message = Message(role='model', content=bot_response_text, chat_id=chat_id)
        db.session.add(bot_message)
        db.session.commit()
        
        return jsonify({
            'response': bot_response_text, 'chat_id': chat_id, 'title': current_chat.title,
            'bot_message_id': bot_message.id 
        })
    except Exception as e:
        print(f"Error in /ask endpoint: {e}")
        db.session.rollback()
        return jsonify({'error': 'An error occurred.'}), 500

@app.route('/chats', methods=['GET'])
@login_required
def get_chats():
    chats = Chat.query.filter_by(user_id=current_user.id).order_by(Chat.id.desc()).all()
    return jsonify([{'id': chat.id, 'title': chat.title} for chat in chats])

@app.route('/chats/<int:chat_id>', methods=['GET'])
@login_required
def get_chat_history(chat_id):
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first_or_404()
    messages = [{'id': msg.id, 'role': msg.role, 'content': msg.content} for msg in chat.messages]
    return jsonify(messages)

@app.route('/rename_chat/<int:chat_id>', methods=['POST'])
@login_required
def rename_chat(chat_id):
    data = request.get_json()
    new_title = data.get('title')
    if not new_title:
        return jsonify({'error': 'New title is required.'}), 400
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first_or_404()
    chat.title = new_title
    db.session.commit()
    return jsonify({'message': 'Chat renamed successfully.'})

@app.route('/feedback', methods=['POST'])
@login_required
def feedback():
    data = request.get_json()
    message_id, feedback_value = data.get('message_id'), data.get('feedback_value')
    if not message_id or feedback_value not in [1, -1]:
        return jsonify({'error': 'Invalid data.'}), 400
    message = Message.query.join(Chat).filter(
        Chat.user_id == current_user.id, Message.id == message_id
    ).first_or_404()
    message.feedback = feedback_value
    db.session.commit()
    return jsonify({'message': 'Feedback received.'})

@app.route('/transcribe', methods=['POST'])
def transcribe():
    audio_file = request.files.get('audio_data')
    if not audio_file:
        return jsonify({'error': 'No audio file provided'}), 400
    transcriber = aai.Transcriber()
    transcript = transcriber.transcribe(audio_file)
    if transcript.status == aai.TranscriptStatus.error:
        return jsonify({'error': transcript.error}), 500
    else:
        return jsonify({'transcription': transcript.text})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_admin_user_if_not_exists()
    app.run(host='0.0.0.0', port=5000, debug=True)