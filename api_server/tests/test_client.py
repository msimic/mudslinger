import json
from api_app import mail


def test_register(client):
    resp = client.get("/client/client_config")
    assert resp.status_code == 200
    assert 'socket_io_host' in resp.json


def test_contact(mocker, client):
    mocker.patch.object(mail, 'send')

    resp = client.post("/client/contact",
        data="somedata")
    assert resp.status_code == 400
    assert not mail.send.called

    resp = client.post("/client/contact",
        content_type='application/json',
        data=json.dumps({
            # 'message': 'some message',
            'email': 'some@email.com',
            'client_info': {'some': 'info'}
        }))
    assert not mail.send.called
    assert resp.status_code == 400

    resp = client.post("/client/contact",
        content_type='application/json',
        data=json.dumps({
            'message': 'some message',
            # 'email': 'some@email.com',
            'client_info': {'some': 'info'}
        }))
    assert not mail.send.called
    assert resp.status_code == 400

    resp = client.post("/client/contact",
        content_type='application/json',
        data=json.dumps({
            'message': 'some message',
            'email': 'some@email.com',
            # 'client_info': {'some': 'info'}
        }))
    assert not mail.send.called
    assert resp.status_code == 400
    
    resp = client.post("/client/contact",
        content_type='application/json',
        data=json.dumps({
            'message': 'some message',
            'email': 'some@email.com',
            'client_info': {'some': 'info'}
        }))
    assert mail.send.called
    assert resp.status_code == 200
    assert resp.json['sent'] == True