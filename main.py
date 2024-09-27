from flask import Flask
from flask_security import Security, SQLAlchemyUserDatastore
from application.models import db, User, Role
from application.resources import api  # Import the API instance
from config import DevelopmentConfig
from application.sec import datastore
from application.worker import celery_init_app
import flask_excel as excel
from celery.schedules import crontab
from application.tasks import daily_reminder, monthly_report
#from application.instance import cache

def create_app():
    app = Flask(__name__)
    app.config.from_object(DevelopmentConfig)  # Load the configuration from the DevelopmentConfig class
    
    # Initialize SQLAlchemy with the Flask app
    db.init_app(app)
    
    # Initialize Flask-RESTful with the Flask app
    api.init_app(app)

    #Initialize exel
    excel.init_excel(app)
    
    # Initialize Flask_Security
    app.security = Security(app, datastore)

    #Initialize Catch 
    #cache.init_app(app)
    
    with app.app_context():
        import application.views  # Import views or other components here

    return app

app = create_app()
celery_app = celery_init_app(app)

@celery_app.on_after_configure.connect
def send_email(sender, **kwargs):
    #sender.add_periodic_task(crontab(hour=8, minute=0, day_of_month=1), monthly_report.s())
    #sender.add_periodic_task(crontab(hour=18, minute=37),daily_reminder.s())
    sender.add_periodic_task(40, daily_reminder.s())
    sender.add_periodic_task(30, monthly_report.s())


if __name__ == '__main__':
    app.run(debug=True)

