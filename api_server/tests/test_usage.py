import base64
import json

import pytest
from api_app import usage


@pytest.mark.parametrize('path', (
    '/usage/disconnect',
    '/usage/connect'
))
def test_tn_proxy_auth_login_required(client, path):
    response = client.post(path)
    assert response.status_code == 401


def test_tn_proxy_connect(app, client):
    token = usage.gen_tn_proxy_token(app, "test_id")
    credentials = base64.b64encode(token + b":none").decode('utf-8')
    auth_header_val = "Basic {}".format(credentials)


    response = client.post(
        '/usage/connect',
        data=json.dumps({'abc': 123}),
        headers={
            "Authorization": auth_header_val
        })
    assert response.status_code == 400
    assert response.json['error'] == 'no json'


    response = client.post(
        '/usage/connect',
        content_type='application/json',
        data=json.dumps({'abc': 123}),
        headers={
            "Authorization": auth_header_val
        })
    assert response.status_code == 400
    assert response.json['error'] == 'missing field'


    response = client.post(
        '/usage/connect',
        content_type='application/json',
        data=json.dumps({
            'sid': 'somesid',
            'from_addr': 'someip',
            'to_addr': 'somehost',
            'to_port': 1234,
            'time_stamp': 'somets',
        }),
        headers={
            "Authorization": auth_header_val
        })
    assert response.status_code == 200


def test_tn_proxy_disconnect(app, client):
    token = usage.gen_tn_proxy_token(app, "test_id")
    credentials = base64.b64encode(token + b":none").decode('utf-8')
    auth_header_val = "Basic {}".format(credentials)


    response = client.post(
        '/usage/disconnect',
        data=json.dumps({'abc': 123}),
        headers={
            "Authorization": auth_header_val
        })
    assert response.status_code == 400
    assert response.json['error'] == 'no json'


    response = client.post(
        '/usage/disconnect',
        content_type='application/json',
        data=json.dumps({'abc': 123}),
        headers={
            "Authorization": auth_header_val
        })
    assert response.status_code == 400
    assert response.json['error'] == 'missing field'


    response = client.post(
        '/usage/disconnect',
        content_type='application/json',
        data=json.dumps({
            'uuid': 'someuuid',
            'sid': 'somesid',
            'from_addr': 'someip',
            'to_addr': 'somehost',
            'to_port': 1234,
            'time_stamp': 'somets',
            'elapsed_ms': 4321
        }),
        headers={
            "Authorization": auth_header_val
        })
    assert response.status_code == 200


    response = client.post(
        '/usage/disconnect',
        content_type='application/json',
        data=json.dumps({
            'sid': 'somesid',
            'from_addr': 'someip',
            'to_addr': 'somehost',
            'to_port': 1234,
            'time_stamp': 'somets'
        }),
        headers={
            "Authorization": auth_header_val
        })
    assert response.status_code == 200
