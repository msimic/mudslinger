import os
import tempfile

import pytest
from api_app import create_app
from api_app.db import get_db, migrate_db

with open(os.path.join(os.path.dirname(__file__), 'data.sql'), 'rb') as f:
    _data_sql = f.read().decode('utf8')


@pytest.fixture
def app():
    db_fd, db_path = tempfile.mkstemp()

    app = create_app({
        'TESTING': True,
        'DATABASE': db_path,
    })

    with app.app_context():
        migrate_db()
        get_db().executescript(_data_sql)

    yield app

    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def runner(app):
    return app.test_cli_runner()


class AdminAuthActions(object):
    def __init__(self, client):
        self._client = client

    def login(self, username='test', password='test'):
        return self._client.post(
            '/admin_auth/admin_login',
            data={'username': username, 'password': password}
        )

    def logout(self):
        return self._client.get('/admin_auth/admin_logout')


@pytest.fixture
def admin_auth(client):
    return AdminAuthActions(client)


class AuthActions(object):
    def __init__(self, client):
        self._client = client

    def login(self, email='test', password='test'):
        return self._client.post(
            '/auth/login',
            data={'email': email, 'password': password}
        )

    def logout(self):
        return self._client.get('/auth/logout')


@pytest.fixture
def auth(client):
    return AuthActions(client)