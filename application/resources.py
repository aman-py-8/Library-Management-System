from flask_restful import Api, Resource, reqparse, fields, marshal_with
from flask import request
from application.models import db, Role, User, Section, Ebook, Rating, UserEbook
from flask_security import login_user, auth_required, roles_required, current_user
#from .instance import cache

api = Api(prefix="/api")

# Define request parsers
role_parser = reqparse.RequestParser()
role_parser.add_argument('name', type=str, required=True, help='Name of the role')
role_parser.add_argument('description', type=str, help='Description of the role')

user_parser = reqparse.RequestParser()
user_parser.add_argument('email', type=str, required=True, help='Email of the user')
user_parser.add_argument('password', type=str, required=True, help='Password of the user')
user_parser.add_argument('active', type=bool, help='Active status of the user')
user_parser.add_argument('roles', type=int, action='append', help='Roles of the user')
user_parser.add_argument('profile', type=str, help='Profile of the user')

section_parser = reqparse.RequestParser()
section_parser.add_argument('name', type=str, required=True, help='Name of the section')
section_parser.add_argument('description', type=str, help='Description of the section')

ebook_parser = reqparse.RequestParser()
ebook_parser.add_argument('name', type=str, required=True, help='Name of the ebook')
ebook_parser.add_argument('content', type=str, required=True, help='Content of the ebook')
ebook_parser.add_argument('authors', type=str, help='Authors of the ebook')
ebook_parser.add_argument('section_id', type=int, required=True, help='Section ID of the ebook')

rating_parser = reqparse.RequestParser()
rating_parser.add_argument('rating', type=int, required=True, help='Rating value')

rating_parser.add_argument('ebook_id', type=int, required=True, help='Ebook ID being rated')
rating_parser.add_argument('review', type=str, required=False, help='Please Provide Ebook Review')

# Resource fields for marshalling
role_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'description': fields.String
}

user_fields = {
    'id': fields.Integer,
    'email': fields.String,
    'password': fields.String,
    'active': fields.Boolean,
    'confirmed_at': fields.DateTime,
    'roles': fields.List(fields.Nested(role_fields)),
    'max_ebook_requests': fields.Integer,
    'profile': fields.String
}

section_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'date_created': fields.DateTime,
    'description': fields.String
}

ebook_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'content': fields.String,
    'authors': fields.String,
    'section_id': fields.Integer,
    'average_rating': fields.Float,
    'ratings': fields.List(fields.Nested({
        'id': fields.Integer,
        'rating': fields.Integer,
        'Review': fields.String,
        'user_id': fields.Integer,
        'ebook_id': fields.Integer,
        'date_rated': fields.DateTime
    }))
}

rating_fields = {
    'id': fields.Integer,
    'rating': fields.Integer,
    'Review': fields.String,
    'user_id': fields.Integer,
    'ebook_id': fields.Integer,
    'date_rated': fields.DateTime
}

# Role Resource
class RoleResource(Resource):
    @marshal_with(role_fields)
    def get(self, role_id):
        role = Role.query.get_or_404(role_id)
        return role

    @marshal_with(role_fields)
    def put(self, role_id):
        args = role_parser.parse_args()
        role = Role.query.get_or_404(role_id)
        role.name = args['name']
        role.description = args.get('description')
        db.session.commit()
        return role

    def delete(self, role_id):
        role = Role.query.get_or_404(role_id)
        db.session.delete(role)
        db.session.commit()
        return '', 204

class RoleListResource(Resource):
    @marshal_with(role_fields)
    def get(self):
        roles = Role.query.all()
        return roles

    @marshal_with(role_fields)
    def post(self):
        args = role_parser.parse_args()
        role = Role(name=args['name'], description=args.get('description'))
        db.session.add(role)
        db.session.commit()
        return role, 201

# User Resource
class UserResource(Resource):
    @marshal_with(user_fields)
    def get(self, user_id):
        user = User.query.get_or_404(user_id)
        return user

    @marshal_with(user_fields)
    def put(self, user_id):
        args = user_parser.parse_args()
        user = User.query.get_or_404(user_id)
        user.email = args['email']
        user.password = args['password']
        user.active = args.get('active')
        user.profile = args.get('profile')
        user.max_ebook_requests = args.get('max_ebook_requests', 5)
        user.roles = Role.query.filter(Role.id.in_(args['roles'])).all() if args['roles'] else []
        db.session.commit()
        return user

    def delete(self, user_id):
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        return '', 204

class UserListResource(Resource):
    @marshal_with(user_fields)
    def get(self):
        users = User.query.all()
        return users

    @marshal_with(user_fields)
    def post(self):
        args = user_parser.parse_args()
        user = User(email=args['email'], password=args['password'], active=args.get('active', True), 
                     max_ebook_requests=args.get('max_ebook_requests', 5), 
                     profile=args.get('profile'))
        user.roles = Role.query.filter(Role.id.in_(args['roles'])).all() if args['roles'] else []
        db.session.add(user)
        db.session.commit()
        return user, 201

# Section Resource
class SectionResource(Resource):
    @marshal_with(section_fields)
    #@cache.cached(timeout=50)
    def get(self, section_id):
        section = Section.query.get_or_404(section_id)
        return section

    @marshal_with(section_fields)
    def put(self, section_id):
        args = section_parser.parse_args()
        section = Section.query.get_or_404(section_id)
        section.name = args['name']
        section.description = args.get('description')
        db.session.commit()
        return section

    def delete(self, section_id):
        section = Section.query.get_or_404(section_id)
        db.session.delete(section)
        db.session.commit()
        return '', 204

class SectionListResource(Resource):
    @roles_required("librarian")
    @marshal_with(section_fields)
    #@cache.cached(timeout=50)
    def get(self):
        sections = Section.query.all()
        return sections

    @marshal_with(section_fields)
    @roles_required("librarian")
    def post(self):
        args = section_parser.parse_args()
        section = Section(name=args['name'], description=args.get('description'))
        db.session.add(section)
        db.session.commit()
        return section, 201

# Ebook Resource
class EbookResource(Resource):
    @marshal_with(ebook_fields)
    #@cache.cached(timeout=50)
    def get(self, ebook_id):
        ebook = Ebook.query.get_or_404(ebook_id)
        if request.args.get('include_rating', 'false') == 'true':
            average_rating = ebook.average_rating(ebook.id)
            ebook = {
                'id': ebook.id,
                'name': ebook.name,
                'authors': ebook.authors,
                'average_rating': average_rating
            }
        else:
            ebook = ebook
        return ebook

    @marshal_with(ebook_fields)
    def put(self, ebook_id):
        args = ebook_parser.parse_args()
        ebook = Ebook.query.get_or_404(ebook_id)

        # Update the ebook fields
        ebook.name = args['name']
        ebook.content = args['content']
        ebook.authors = args.get('authors', ebook.authors)  # Use existing value if not provided
        ebook.section_id = args.get('section_id', ebook.section_id)  # Use existing value if not provided

        db.session.commit()
        return ebook

    def delete(self, ebook_id):
        ebook = Ebook.query.get_or_404(ebook_id)
        db.session.delete(ebook)
        db.session.commit()
        return '', 204

class EbookListResource(Resource):
    @marshal_with(ebook_fields)
    def get(self):
        section_id = request.args.get('section_id')
        if section_id:
            ebooks = Ebook.query.filter_by(section_id=section_id).all()
        else:
            ebooks = Ebook.query.all()
            
        return ebooks

    @marshal_with(ebook_fields)
    def post(self):
        args = ebook_parser.parse_args()
        ebook = Ebook(name=args['name'], content=args['content'], authors=args.get('authors'), 
                      section_id=args['section_id'])
        db.session.add(ebook)
        db.session.commit()
        return ebook, 201

# Rating Resource
class RatingResource(Resource):
    @marshal_with(rating_fields)
    def get(self, rating_id):
        rating = Rating.query.get_or_404(rating_id)
        return rating

    @marshal_with(rating_fields)
    def put(self, rating_id):
        args = rating_parser.parse_args()
        rating = Rating.query.get_or_404(rating_id)
        rating.rating = args['rating']
        rating.user_id = args['user_id']
        rating.ebook_id = args['ebook_id']
        db.session.commit()
        return rating

    def delete(self, rating_id):
        rating = Rating.query.get_or_404(rating_id)
        db.session.delete(rating)
        db.session.commit()
        return '', 204

class RatingListResource(Resource):
    @marshal_with(rating_fields)
    def get(self):
        ratings = Rating.query.all()
        return ratings

    @marshal_with(rating_fields)
    def post(self):
        args = rating_parser.parse_args()
        if not current_user.is_authenticated:
            return {'message': 'User is not authenticated'}, 401
        rating = Rating(rating=args['rating'], user_id=current_user.id, ebook_id=args['ebook_id'], Review=args.get('review'))
        db.session.add(rating)
        db.session.commit()
        return rating, 201

class EbookRequestResource(Resource):
    @marshal_with({
        'id': fields.Integer,
        'ebook_id': fields.Integer,
        'user_id': fields.Integer,
        'date_requested': fields.DateTime,
        'granted': fields.Boolean
    })
    def get(self):
        # Fetch all ebook requests from the database
        requests = UserEbook.query.all()
        return requests

    def post(self, request_id):
        # Grant the ebook request
        request = UserEbook.query.get_or_404(request_id)
        request.granted = True
        db.session.commit()
        return '', 204



# Registering Resources
api.add_resource(RoleResource, '/roles/<int:role_id>')
api.add_resource(RoleListResource, '/roles')

api.add_resource(UserResource, '/users/<int:user_id>')
api.add_resource(UserListResource, '/users')

api.add_resource(SectionResource, '/sections/<int:section_id>')
api.add_resource(SectionListResource, '/sections')

api.add_resource(EbookResource, '/ebooks/<int:ebook_id>')
api.add_resource(EbookListResource, '/ebooks')

api.add_resource(RatingResource, '/ratings/<int:rating_id>')
api.add_resource(RatingListResource, '/ratings')

api.add_resource(EbookRequestResource, '/ebook-requests')
