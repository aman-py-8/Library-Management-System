# utils.py
from itsdangerous import URLSafeTimedSerializer as Serializer, BadSignature, SignatureExpired
from flask import current_app
from .models import User  

def verify_auth_token(token):
    s = Serializer(current_app.config['SECRET_KEY'])
    try:
        data = s.loads(token, salt=current_app.config['SECURITY_PASSWORD_SALT'])
    except SignatureExpired:
        return None  # Token expired
    except BadSignature:
        return None  # Invalid token
    return User.query.get(data['user_id'])
