import pytest


def test_index(client, admin_auth):
    admin_auth.login()
    assert client.get("/admin/").status_code == 200


@pytest.mark.parametrize("path", (
    "/admin/client_config",
    "/admin/proxy_conn_monitor"))
def test_login_required(client, path):
    response = client.get(path)
    assert response.headers["Location"] == "http://localhost/admin_auth/admin_login"


def test_client_config(client, admin_auth):
    admin_auth.login()
    assert client.get("/admin/client_config").status_code == 200


def test_proxy_conn_monitor(client, admin_auth):
    admin_auth.login()
    assert client.get("/admin/proxy_conn_monitor").status_code == 200


def test_add_del_telnet_proxy_admin(client, admin_auth):
    admin_auth.login()
    
    resp = client.post(
        '/admin/add_del_telnet_proxy_admin',
        data={
            'oper': 'add',
            'proxy-url': 'someurl'
        }, follow_redirects=True)
    assert b'Entry added.' in resp.data

    resp = client.post(
        '/admin/add_del_telnet_proxy_admin',
        data={
            'oper': 'add',
            'proxy-url': 'someurl'
        }, follow_redirects=True)
    assert b'That proxy is already registered.' in resp.data

    resp = client.post(
        '/admin/add_del_telnet_proxy_admin',
        data={
            'oper': 'del',
            'proxy-url': 'someurl'
        }, follow_redirects=True)
    assert b'Entry deleted.' in resp.data

    resp = client.post(
        '/admin/add_del_telnet_proxy_admin',
        data={
            'oper': 'del',
            'proxy-url': 'someurl'
        }, follow_redirects=True)
    assert b'No such proxy.' in resp.data

    resp = client.post(
        '/admin/add_del_telnet_proxy_admin',
        data={
            'oper': 'fakeoper',
            'proxy-url': 'someurl'
        }, follow_redirects=True)
    assert resp.status_code == 400
