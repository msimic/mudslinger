import os

from flask import Flask
from flask_cors import CORS
from flask_mail import Mail


mail = Mail()


def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'api_app.sqlite'),
        CONTACT_SMTP_RECEIVERS=["dr.vodur@gmail.com"]
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # a simple page that says hello
    @app.route('/hello')
    def hello():
        return 'Hello, World!'

    from . import db
    db.init_app(app)

    from . import admin_auth
    from . import usage
    from . import admin
    from . import client
    app.register_blueprint(admin_auth.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(usage.bp)
    app.register_blueprint(client.bp)
    usage.init_app(app)

    CORS(app)
    mail.init_app(app)

    return app