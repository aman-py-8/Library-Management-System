from main import app
from application.sec import datastore
from application.models import db
from flask_security.utils import hash_password
from werkzeug.security import generate_password_hash

with app.app_context():
    db.create_all()
    
    # Create roles
    if not datastore.find_role("librarian"):
        datastore.create_role(name="librarian", description="User is a librarian")
    if not datastore.find_role("user"):
        datastore.create_role(name="user", description="This is a general user")
    db.session.commit()

    # Create users and assign roles
    if not datastore.find_user(email="librarian@email.com"):
        librarian = datastore.create_user(
            email="librarian@email.com", password=generate_password_hash("librarian"))
        datastore.add_role_to_user(librarian, "librarian")
        
    if not datastore.find_user(email="user1@email.com"):
        user = datastore.create_user(
            name = "User1", email="user1@email.com", password=generate_password_hash("user1"))
        datastore.add_role_to_user(user, "user")
    
    db.session.commit()


