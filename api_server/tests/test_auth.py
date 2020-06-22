import pytest
from flask import g
from flask import session

from api_app.db import get_db


def test_register(client, app):
    # test that viewing the page renders without template errors
    assert client.get("/auth/register").status_code == 200

    # test that successful registration redirects to the login page
    response = client.post("/auth/register", data={"email": "a", "password": "a"})
    assert "http://localhost/auth/login" == response.headers["Location"]

    # test that the user was inserted into the database
    with app.app_context():
        assert (
            get_db().execute("select * from user where email = 'a'").fetchone()
            is not None
        )


@pytest.mark.parametrize(
    ("email", "password", "message"),
    (
        ("", "", b"Email is required."),
        ("a", "", b"Password is required."),
        ("test", "test", b"already registered"),
    ),
)
def test_register_validate_input(client, email, password, message):
    response = client.post(
        "/auth/register", data={"email": email, "password": password}
    )
    assert message in response.data


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
