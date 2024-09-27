from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from flask import current_app
from flask_security import UserMixin
from itsdangerous import URLSafeTimedSerializer as Serializer
from datetime import datetime

db = SQLAlchemy()  # Initialize SQLAlchemy

roles_users = db.Table('roles_users',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'))
)

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(30), nullable=True)
    email = db.Column(db.String(255), unique=True)
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean, default=True)
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False)
    roles = db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))
    max_ebook_requests = db.Column(db.Integer, default=5)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)
    profile = db.Column(db.String(255))  # Additional field for user profile
    def get_auth_token(self, expiration=3600):
        s = Serializer(current_app.config['SECRET_KEY'])
        return s.dumps({'user_id': self.id}, salt=current_app.config['SECURITY_PASSWORD_SALT'])
    
class Section(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    description = db.Column(db.Text)
    ebooks = db.relationship('Ebook', backref='section', lazy='dynamic')


class Ebook(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    authors = db.Column(db.String(255))
    section_id = db.Column(db.Integer, db.ForeignKey('section.id'))
    ratings = db.relationship('Rating', backref='ebook', lazy='dynamic')
    # Relationship with GrantedBook
    granted_books = db.relationship('GrantedBook', backref='ebook', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'author': self.authors
        }
    @property
    def average_rating(self):
        ratings = Rating.query.filter_by(ebook_id=self.id).all()
        if ratings:
            return round(sum(rating.rating for rating in ratings) / len(ratings))
        return None

class UserEbook(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    ebook_id = db.Column(db.Integer, db.ForeignKey('ebook.id'), nullable=False)
    date_requested = db.Column(db.DateTime, default=db.func.current_timestamp())
    return_date = db.Column(db.DateTime)
    
    user = db.relationship('User', backref=db.backref('user_ebooks', lazy=True))
    ebook = db.relationship('Ebook', backref=db.backref('user_ebooks',cascade='all, delete-orphan', lazy=True))

class GrantedBook(db.Model):
    __tablename__ = 'granted_books'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    ebook_id = db.Column(db.Integer, db.ForeignKey('ebook.id'), nullable=False)
    
    # Relationship with User
    user = db.relationship('User', backref='granted_books', lazy=True)
    def to_dict(self):
        return {
            'id': self.id,
            'ebook': self.ebook.to_dict(),  # Convert related Ebook to dict
            'user_id': self.user_id,
            'ebook_id': self.ebook_id
        }


class Rating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)
    Review = db.Column(db.String(120), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    ebook_id = db.Column(db.Integer, db.ForeignKey('ebook.id'))
    date_rated = db.Column(db.DateTime, default=db.func.current_timestamp())
