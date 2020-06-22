import pytest
from flask import g
from flask import session

from api_app.db import get_db


def test_login(client, admin_auth):
    # test that viewing the page renders without template errors
    assert client.get("/admin_auth/admin_login").status_code == 200

    # test that successful login redirects to the index page
    response = admin_auth.login()
    assert response.headers["Location"] == "http://localhost/admin/"

    # login request set the user_id in the session
    # check that the user is loaded from the session
    with client:
        client.get("/")
        assert session["admin_user_id"] == 1
        assert g.admin_user["username"] == "test"


@pytest.mark.parametrize(
    ("username", "password", "message"),
    (("a", "test", b"Incorrect username."), ("test", "a", b"Incorrect password.")),
)
def test_login_validate_input(admin_auth, username, password, message):
    response = admin_auth.login(username, password)
    assert message in response.data


def test_logout(client, admin_auth):
    admin_auth.login()

    with client:
        admin_auth.logout()
        assert "admin_user_id" not in session
