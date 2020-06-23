import pytest
from flask import g
from flask import session

from api_app.db import get_db
from api_app import auth

import itsdangerous


def test_sigs(client, app):
    sig = auth.dump_sig(app, 'someval', auth.REGISTER_SALT)
    with pytest.raises(itsdangerous.exc.BadTimeSignature):
        auth.load_sig(app, sig, 3600, auth.RESET_SALT)
    o = auth.load_sig(app, sig, 3600, auth.REGISTER_SALT)
    assert o == 'someval'


def test_register(client, app):
    assert client.get("/auth/register").status_code == 200


def test_register_confirm(client, app):
    sig = auth.dump_sig(app, {'email': 'fake@email.com'}, auth.REGISTER_SALT)
    assert client.get(f"/auth/{sig}/register").status_code == 200

    # test that successful registration redirects to the login page
    response = client.post(f"/auth/{sig}/register", data={"password": "a", "password2": "a"})
    assert "http://localhost/auth/login" == response.headers["Location"]

    # test that the user was inserted into the database
    with app.app_context():
        assert (
            get_db().execute("select * from user where email = 'fake@email.com'").fetchone()
            is not None
        )


def test_reset_password(client, app):
    assert client.get(f"/auth/reset_password").status_code == 200


def test_reset_password_confirm(client, app):
    sig = auth.dump_sig(app, {'email': 'fake@email.com'}, auth.RESET_SALT)
    assert client.get(f"/auth/{sig}/reset_password").status_code == 200

    response = client.post(f"/auth/{sig}/reset_password", data={"password": "a", "password2": "a"})
    assert "http://localhost/auth/login" == response.headers["Location"]


def test_login(client, auth):
    # test that viewing the page renders without template errors
    assert client.get("/auth/login").status_code == 200

    # test that successful login redirects to the profiles
    response = auth.login()
    assert response.headers["Location"] == "http://localhost/user/profiles"

    # login request set the user_id in the session
    # check that the user is loaded from the session
    with client:
        client.get("/")
        assert session["user_id"] == 1
        assert g.user["email"] == "test"


@pytest.mark.parametrize(
    ("email", "password", "message"),
    (("a", "test", b"Incorrect email."), ("test", "a", b"Incorrect password.")),
)
def test_login_validate_input(auth, email, password, message):
    response = auth.login(email, password)
    assert message in response.data


def test_logout(client, auth):
    auth.login()

    with client:
        auth.logout()
        assert "user_id" not in session
