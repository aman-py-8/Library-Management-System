from flask import current_app as app, jsonify, request, render_template, send_file
from flask_security import login_user, auth_required, roles_required, current_user
from werkzeug.security import check_password_hash
from werkzeug.security import generate_password_hash
from .models import User, db, Role, Section, Ebook, UserEbook, GrantedBook
from .sec import datastore
import uuid
from flask import send_from_directory
from datetime import datetime
from .utils import verify_auth_token
from .tasks import create_ebook_csv
from celery.result import AsyncResult
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

@app.get('/')
def home():
    return render_template("index.html")



@app.get('/librarian')
@auth_required("token")
@roles_required("librarian")
def librarian():
    return "welcome librarian"

@app.route('/user-login', methods=['POST'])
def user_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid credentials"}), 401

    # Update last_active timestamp
    user.last_active = datetime.utcnow()
    db.session.commit()

    # Use Flask-Security's login_user function
    login_user(user)

    # If you're using Flask-Security's token-based authentication
    token = current_user.get_auth_token()  # This will only work if `get_auth_token()` is defined
    
    return jsonify({
        "token": token,
        "role": [role.name for role in user.roles],
        "user_id": user.id
    })
    
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 400

    hashed_password = generate_password_hash(password)
    user_role = Role.query.filter_by(name='user').first()
    if not user_role:
        user_role = Role(name='user')
        db.session.add(user_role)
        db.session.commit()

    new_user = User(
        email=email, 
        password=hashed_password, 
        roles=[user_role], 
        name = name,
        fs_uniquifier=str(uuid.uuid4())
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Registration successful"}), 201

@app.route('/add-section', methods=['POST'])
def add_section():
    data = request.get_json()
    new_section = Section(
        name=data['name'],
        description=data['description']
    )
    db.session.add(new_section)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Section added successfully!'}), 201

@app.route('/sections', methods=['GET'])
@auth_required("token")
@roles_required("librarian")
def get_sections():
    sections = Section.query.all()
    sections_data = []
    for section in sections:
        sections_data.append({
            'id': section.id,
            'name': section.name,
            'description': section.description,
            'date_created': section.date_created.strftime('%Y-%m-%d %H:%M:%S')  # Format date to string
        })
    return jsonify(sections_data)

@app.route('/sections/<int:section_id>', methods=['GET'])
def get_section(section_id):
    section = Section.query.get(section_id)
    if section:
        return jsonify({
            'id': section.id,
            'name': section.name,
            'description': section.description,
            'date_created': section.date_created.isoformat()
        })
    else:
        return jsonify({'error': 'Section not found'}), 404
    
@app.route('/sections/<int:section_id>/add-book', methods=['POST'])
def add_book(section_id):
    data = request.get_json()
    
    # Fetch the section
    section = Section.query.get(section_id)
    if not section:
        return jsonify({'error': 'Section not found'}), 404

    # Validate the incoming data
    name = data.get('name')
    content = data.get('content')
    authors = data.get('authors')

    if not name or not content or not authors:
        return jsonify({'error': 'Missing required fields'}), 400

    # Create and add the new book
    book = Ebook(
        name=name,
        content=content,
        authors=authors,
        section_id=section_id
    )
    db.session.add(book)
    db.session.commit()
    
    # Return a success response
    return jsonify({'message': 'Book added successfully', 'book': book.id}), 201

@app.route('/sections/<int:section_id>/books', methods=['GET'])
def get_books(section_id):
    section = Section.query.get(section_id)
    if not section:
        return jsonify({'error': 'Section not found'}), 404

    books = Ebook.query.filter_by(section_id=section_id).all()
    books_list = [
        {
            'id': book.id,
            'name': book.name,
            'content': book.content,
            'authors': book.authors
        }
        for book in books
    ]

    return jsonify(books_list), 200

@app.route('/request-ebook', methods=['POST'])
def request_ebook():
    data = request.get_json()
    ebook_id = data.get('ebook_id')
    token = request.headers.get('Authorization').split(" ")[1]

    user = verify_auth_token(token)
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    if not ebook_id:
        return jsonify({'message': 'Ebook ID is required'}), 400

    ebook = Ebook.query.get(ebook_id)
    if not ebook:
        return jsonify({'message': 'Ebook not found'}), 404

    # Check if the user has already requested 5 ebooks
    if len(user.user_ebooks) >= user.max_ebook_requests:
        return jsonify({'message': 'You have reached the maximum number of ebook requests'}), 400

    # Check if the user already has the ebook
    existing_request = UserEbook.query.filter_by(user_id=user.id, ebook_id=ebook_id).first()
    if existing_request:
        return jsonify({'message': 'Ebook already requested'}), 400

    # Create a new request
    user_ebook = UserEbook(user_id=user.id, ebook_id=ebook_id)
    db.session.add(user_ebook)
    db.session.commit()

    return jsonify({'message': 'Ebook requested successfully'}), 201

@app.route('/return-ebook', methods=['POST'])
def return_ebook():
    data = request.get_json()
    ebook_id = data.get('ebook_id')
    token = request.headers.get('Authorization').split(" ")[1]

    user = verify_auth_token(token)
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    if not ebook_id:
        return jsonify({'message': 'Ebook ID is required'}), 400

    user_ebook = UserEbook.query.filter_by(user_id=user.id, ebook_id=ebook_id).first()
    if not user_ebook:
        return jsonify({'message': 'No record found for the given ebook'}), 404

    db.session.delete(user_ebook)
    db.session.commit()

    return jsonify({'message': 'Ebook returned successfully'}), 200


@app.route('/api/ebook-requests/<int:request_id>/grant', methods=['POST'])
def grant_request(request_id):
    request_obj = UserEbook.query.get(request_id)
    if request_obj:
        # Create a GrantedBook entry
        granted_book = GrantedBook(user_id=request_obj.user_id, ebook_id=request_obj.ebook_id)
        db.session.add(granted_book)
        db.session.delete(request_obj)
        db.session.commit()
        return jsonify({'message': 'Request granted'}), 200
    return jsonify({'message': 'Request not found'}), 404

from flask import jsonify, request
from .models import UserEbook, db

@app.route('/api/ebook-requests/<int:request_id>/reject', methods=['DELETE'])
def reject_request(request_id):
    # Find the request by ID
    request_to_delete = UserEbook.query.get(request_id)
    if not request_to_delete:
        return jsonify({'message': 'Request not found'}), 404

    # Delete the request
    db.session.delete(request_to_delete)
    db.session.commit()

    return jsonify({'message': 'Request rejected and deleted successfully'}), 200


@app.route('/api/granted_books', methods=['GET'])
def get_granted_books():
    # Fetch the granted books for the current user
    user_id = current_user.id
    granted_books = GrantedBook.query.filter_by(user_id=user_id).all()
    return jsonify([book.to_dict() for book in granted_books])

@app.route('/api/all_granted_books', methods=['GET'])
@roles_required('librarian')  # Ensure only librarians can access this route
def get_all_granted_books():
    # Fetch all granted books for all users
    granted_books = GrantedBook.query.all()
    
    # Create a list of dictionaries with detailed book and user info
    detailed_granted_books = []
    for book in granted_books:
        book_data = book.to_dict()  # Get basic book data
        user = User.query.get(book.user_id)  # Fetch the user object
        book_data['user'] = {
            'id': user.id,
            'email': user.email  # Include detailed user info
        }
        detailed_granted_books.append(book_data)
    
    return jsonify(detailed_granted_books)

@app.route('/api/granted_books/<int:book_id>', methods=['DELETE'])
def return_granted_book(book_id):
    # Remove the granted book for the current user
    user_id = current_user.id
    granted_book = GrantedBook.query.filter_by(user_id=user_id, book_id=book_id).first()
    if not granted_book:
        return jsonify({"error": "Book not found"}), 404

    db.session.delete(granted_book)
    db.session.commit()
    return jsonify({"message": "Book returned successfully"})

@app.route('/api/return-book/<int:book_id>', methods=['POST'])
def return_book(book_id):
    # Assume user is authenticated and their ID is obtained from the session or token
    user_id = request.json.get('user_id')  # You should get the user_id from the session or authentication token
    
    if not user_id:
        return jsonify({'message': 'User ID is required'}), 400
    
    # Find the granted book record for the given book ID and user ID
    granted_book = GrantedBook.query.filter_by(ebook_id=book_id, user_id=user_id).first()
    
    if granted_book:
        try:
            # Delete the granted book record
            db.session.delete(granted_book)
            db.session.commit()
            return jsonify({'message': 'Book returned successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'An error occurred: {str(e)}'}), 500
    else:
        return jsonify({'message': 'No granted book found for the given ID and user'}), 404
    
@app.route('/api/revoke-book/<int:book_id>', methods=['POST'])
@roles_required('librarian')
def revoke_book(book_id):
    # Logic to revoke book access
    granted_book = GrantedBook.query.filter_by(id=book_id).first()
    
    if granted_book:
        db.session.delete(granted_book)
        db.session.commit()
        return jsonify({'message': 'Access revoked successfully!'}), 200
    else:
        return jsonify({'message': 'Book not found.'}), 404
    
@app.route('/api/user-profile', methods=['GET', 'PUT'])
def user_profile():
    token = request.headers.get('Authentication-Token')
    if not token:
        return jsonify({'message': 'Unauthorized'}), 401

    user = verify_auth_token(token)
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    if request.method == 'GET':
        return jsonify({
            "email": user.email,
            "name": user.name,
            # Add more fields as needed
        })

    if request.method == 'PUT':
        data = request.get_json()
        user.name = data.get('name', user.name)
        # Update more fields as needed
        db.session.commit()
        return jsonify({"message": "Profile updated successfully!"})

@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('query', '')
    
    if not query:
        return jsonify({'message': 'Search query is required'}), 400
    
    # Search Sections
    sections = Section.query.filter(Section.name.ilike(f'%{query}%')).all()
    section_results = [{'id': section.id, 'name': section.name} for section in sections]
    
    # Search E-books
    ebooks = Ebook.query.filter(
        (Ebook.name.ilike(f'%{query}%')) |
        (Ebook.authors.ilike(f'%{query}%')) |
        (Ebook.section.has(Section.name.ilike(f'%{query}%')))
    ).all()
    ebook_results = [{'id': ebook.id, 'name': ebook.name, 'author': ebook.authors, 'section': ebook.section.name if ebook.section else 'Unknown'} for ebook in ebooks]
    
    results = {
        'sections': section_results,
        'ebooks': ebook_results
    }
    
    return jsonify(results)

@app.route('/api/stats', methods=['GET'])
@roles_required('librarian')
def get_stats():
    total_ebooks = Ebook.query.count()
    total_users = User.query.count()
    total_requests = UserEbook.query.count()
    total_granted_books = GrantedBook.query.count()
    total_sections = Section.query.count()

    stats = {
        'total_ebooks': total_ebooks,
        'total_users': total_users,
        'total_requests': total_requests,
        'total_granted_books': total_granted_books,
        'total_sections' : total_sections
    }
    return jsonify(stats)

@app.get('/download-csv')
def download_csv():
    task = create_ebook_csv.delay()
    return jsonify({"taskid": task.id})

@app.get('/getcsv/<task_id>')
def getcsv(task_id):
    res = AsyncResult(task_id)
    if res.ready():
        filename = res.result
        return send_file(filename, as_attachment=True)
    else:
        return jsonify({'message': 'Task pending'}), 404
    
@app.route('/api/ebooks/<int:book_id>/download', methods=['GET'])
@roles_required('user')  # Ensure only authenticated users can download
def download_ebook(book_id):
    ebook = Ebook.query.get_or_404(book_id)
    
    # Create a BytesIO buffer to hold the PDF data
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Add content to the PDF
    c.drawString(100, height - 100, f"Title: {ebook.name}")
    c.drawString(100, height - 130, f"Authors: {', '.join(ebook.authors)}")
    c.drawString(100, height - 160, "Content:")
    text = c.beginText(100, height - 190)
    text.setFont("Helvetica", 12)
    text.setTextOrigin(100, height - 200)
    text.textLines(ebook.content)
    c.drawText(text)
    
    # Save the PDF and return it
    c.showPage()
    c.save()
    buffer.seek(0)
    
    return send_file(buffer, as_attachment=True, download_name=f"{ebook.name}.pdf", mimetype='application/pdf')