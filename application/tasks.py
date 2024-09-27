from celery import shared_task
from .models import Ebook, User, Role, GrantedBook
import flask_excel as excel
from .email_service import send_message
from jinja2 import Template
from flask import render_template
from datetime import datetime, timedelta

@shared_task(ignore_result=False)
def create_ebook_csv():
    ebooks = Ebook.query.with_entities(
        Ebook.id,Ebook.section_id, Ebook.name, Ebook.content, Ebook.authors).all()
    csv_output = excel.make_response_from_query_sets(ebooks, ['id', 'section_id', 'name', 'content', 'authors'], "csv")
    
    # Create CSV file
    filename = "ebooks_export.csv"
    with open(filename, 'wb') as f:
        f.write(csv_output.data)

    return filename

@shared_task(ignore_result=True)
def daily_reminder():
    timestamp = datetime.utcnow() - timedelta(hours=24)
    #not_visited_users = User.query.join(User.roles).filter(
    #User.last_active < timestamp,
    #Role.name == 'user').all()

    # FOR Testing
    not_visited_users = User.query.join(User.roles).filter(
        User.last_active < datetime.utcnow(),
        Role.name == 'user').all()
    for user in not_visited_users:
        with open('reminder.html', 'r') as f:
            template = Template(f.read())
            send_message(user.email, "Daily Reminder To Visit E-Library",
                         template.render(name = user.name, email=user.email))
    return "OK"

@shared_task(ignore_result=True)
def monthly_report():
    today = datetime.utcnow().date()
    first_day_of_current_month = today.replace(day=1)
    last_day_of_last_month = first_day_of_current_month - timedelta(days=1)
    first_day_of_last_month = last_day_of_last_month.replace(day=1)

    # Query for granted books in the last month
    granted_books = GrantedBook.query.join(User).filter(
        GrantedBook.user.has(User.last_active.between(first_day_of_last_month, last_day_of_last_month))
    ).all()

    # Generate HTML content using Jinja template
    html_content = render_template('report.html', granted_books=granted_books)

    # Get all users to send the report to
    users = User.query.filter(User.roles.any(Role.name == 'user')).all()
    for user in users:
        send_message(
            user.email,
            "Monthly Report",
            html_content
        )

    return "Monthly report sent"
