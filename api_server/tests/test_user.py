import json

from flask import session

import pytest

from api_app.db import get_db


@pytest.mark.parametrize(("path", "method"), (
    ("/user/profiles", "get"),
    ("/user/convert_local", "post"),
    ("/user/create_profile", "get"),
    ("/user/create_profile", "post"),
    ("/user/123/edit_profile", "get"),
    ("/user/123/edit_profile", "post"),
    ("/user/123/delete_profile", "post"),
    ("/user/123/copy_profile", "post"),
    ))
def test_login_required(client, path, method):
    response = getattr(client, method)(path)
    assert response.headers["Location"] == "http://localhost/auth/login"


def test_profiles(client, auth):
    auth.login()

    resp = client.get("/user/profiles")
    assert resp.status_code == 200


def test_convert_local(client, auth, app):
    auth.login()

    with app.app_context():
        db = get_db()
        count = db.execute("""
            SELECT COUNT(id) 
            FROM profile WHERE user_id = 1
        """).fetchone()[0]
        assert count == 2

    resp = client.post('/user/convert_local',
        data={'user_config': '{"somelocal": "userconfig"}'})
    assert resp.status_code == 200

    with app.app_context():
        db = get_db()
        count = db.execute("""
            SELECT COUNT(id) 
            FROM profile WHERE user_id = 1
        """).fetchone()[0]
        assert count == 3

        new_prof = db.execute("""
            SELECT * FROM profile
            WHERE user_id = 1
            ORDER BY id DESC
            LIMIT 1
        """).fetchone()
        assert new_prof['config'] == '{"somelocal": "userconfig"}'
        assert new_prof['host'] == 'CHANGEME'
        assert new_prof['port'] == 0

    # Sending empty config (should not happen)
    resp = client.post('/user/convert_local',
        data={'user_config': '   '})
    assert resp.status_code == 200

    with app.app_context():
        db = get_db()
        count = db.execute("""
            SELECT COUNT(id) 
            FROM profile WHERE user_id = 1
        """).fetchone()[0]
        assert count == 4

        new_prof = db.execute("""
            SELECT * FROM profile
            WHERE user_id = 1
            ORDER BY id DESC
            LIMIT 1
        """).fetchone()
        assert new_prof['config'] == None
        assert new_prof['host'] == 'CHANGEME'
        assert new_prof['port'] == 0


def _profile_count(app, user_id):
    with app.app_context():
        db = get_db()
        count = db.execute("""
            SELECT COUNT(id) 
            FROM profile WHERE user_id = ?
        """, (user_id,)).fetchone()[0]
        return count


def test_create_profile(client, auth, app):
    auth.login()

    # GET
    resp = client.get('/user/create_profile')
    assert resp.status_code == 200
    
    # POST
    assert _profile_count(app, 1) == 2

    resp = client.post('/user/create_profile',
        data={
            'name': '',
            'host': 'somehostxyz',
            'port': '1235'
        })
    assert resp.status_code == 200
    assert b'Profile name is required' in resp.data
    assert _profile_count(app, 1) == 2

    resp = client.post('/user/create_profile',
        data={
            'name': 'my new profile 1',
            'host': '',
            'port': '1235'
        })
    assert resp.status_code == 200
    assert b'Host is required' in resp.data
    assert _profile_count(app, 1) == 2

    resp = client.post('/user/create_profile',
        data={
            'name': 'my new profile 1',
            'host': 'somehostxyz',
            'port': ''
        })
    assert resp.status_code == 200
    assert b'Port is required' in resp.data
    assert _profile_count(app, 1) == 2

    resp = client.post('/user/create_profile',
        data={
            'name': 'my new profile 1',
            'host': 'somehostxyz',
            'port': 'fakeport'
        })
    assert resp.status_code == 200
    assert b'Port must be an integer' in resp.data
    assert _profile_count(app, 1) == 2

    resp = client.post('/user/create_profile',
        data={
            'name': 'my new profile 1',
            'host': 'somehostxyz',
            'port': '1235'
        })
    assert _profile_count(app, 1) == 3

    with app.app_context():
        db = get_db()

        new_prof = db.execute("""
            SELECT * FROM profile
            WHERE user_id = 1
            ORDER BY id DESC
            LIMIT 1
        """).fetchone()
        assert new_prof['user_id'] == 1
        assert new_prof['name'] == 'my new profile 1'
        assert new_prof['host'] == 'somehostxyz'
        assert new_prof['port'] == 1235
        assert new_prof['config'] == None


def test_edit_profile(client, auth, app):
    auth.login()

    # GET
    resp = client.get('/user/876/edit_profile')
    assert resp.status_code == 404

    resp = client.get('/user/3/edit_profile')
    assert resp.status_code == 403

    resp = client.get('/user/2/edit_profile')
    assert resp.status_code == 200

    # POST
    assert _profile_count(app, 1) == 2

    resp = client.post('/user/2/edit_profile',
        data={
            'name': '',
            'host': 'newhost1',
            'port': '9876'
        })
    assert resp.status_code == 200
    assert b'Profile name is required' in resp.data

    resp = client.post('/user/2/edit_profile',
        data={
            'name': 'new name 1',
            'host': '',
            'port': '9876'
        })
    assert resp.status_code == 200
    assert b'Host is required' in resp.data

    resp = client.post('/user/2/edit_profile',
        data={
            'name': 'new name 1',
            'host': 'newhost1',
            'port': ''
        })
    assert resp.status_code == 200
    assert b'Port is required' in resp.data

    resp = client.post('/user/2/edit_profile',
        data={
            'name': 'new name 1',
            'host': 'newhost1',
            'port': 'fakeport'
        })
    assert resp.status_code == 200
    assert b'Port must be an integer' in resp.data

    resp = client.post('/user/2/edit_profile',
        data={
            'name': 'new name 1',
            'host': 'newhost1',
            'port': '9876'
        })
    assert _profile_count(app, 1) == 2

    with app.app_context():
        db = get_db()

        prof = db.execute("""
            SELECT * FROM profile
            WHERE id = 2
        """).fetchone()
        assert prof['user_id'] == 1
        assert prof['name'] == 'new name 1'
        assert prof['host'] == 'newhost1'
        assert prof['port'] == 9876
        assert prof['config'] == '{"some": "config"}'


def test_delete_profile(client, auth, app):
    auth.login()

    assert _profile_count(app, 1) == 2
    
    resp = client.post('/user/876/delete_profile')
    assert resp.status_code == 404

    resp = client.post('/user/3/delete_profile')
    assert resp.status_code == 403

    resp = client.post('/user/2/delete_profile')
    assert _profile_count(app, 1) == 1

    with app.app_context():
        db = get_db()

        prof = db.execute("""
            SELECT * FROM profile
            WHERE id = 2
        """).fetchone()
        assert prof is None


def test_copy_profile(client, auth, app):
    auth.login()

    assert _profile_count(app, 1) == 2
    
    resp = client.post('/user/876/copy_profile')
    assert resp.status_code == 404

    resp = client.post('/user/3/copy_profile')
    assert resp.status_code == 403

    resp = client.post('/user/2/copy_profile')
    assert _profile_count(app, 1) == 3

    with app.app_context():
        db = get_db()
        ref_prof = db.execute("""
            SELECT * FROM profile
            WHERE id = 2
        """).fetchone()

        prof = db.execute("""
            SELECT * FROM profile
            WHERE user_id = 1
            ORDER BY id DESC
            LIMIT 1
        """).fetchone()
        
        assert prof['name'] == 'Copy of ' + ref_prof['name']
        assert prof['host'] == ref_prof['host']
        assert prof['port'] == ref_prof['port']
        assert prof['config'] == ref_prof['config']


def test_get_profile(client, auth, app):
    resp = client.get('/user/get_profile')
    assert resp.status_code == 403

    auth.login()

    resp = client.get('/user/get_profile')
    assert resp.status_code == 400

    resp = client.get('/user/get_profile?id=876')
    assert resp.status_code == 404

    resp = client.get('/user/get_profile?id=3')
    assert resp.status_code == 403

    resp = client.get('/user/get_profile?id=2')
    assert resp.status_code == 200
    assert resp.json['id'] == 2
    assert resp.json['name'] == 'My profile 2'
    assert resp.json['host'] == 'somehost2.com'
    assert resp.json['port'] == 1235
    assert resp.json['config'] == '{"some": "config"}'


def test_save_profile_config(client, auth, app):
    resp = client.post('/user/save_profile_config')
    assert resp.status_code == 403

    auth.login()

    resp = client.post('/user/save_profile_config')
    assert resp.status_code == 400

    resp = client.post('/user/save_profile_config',
        content_type='application/json',
        data=json.dumps({
            # 'id': '876',
            'config': '{"mynew": "config2"}',
            }))
    assert resp.status_code == 400

    resp = client.post('/user/save_profile_config',
        content_type='application/json',
        data=json.dumps({
            'id': '876',
            # 'config': '{"mynew": "config2"}',
            }))
    assert resp.status_code == 400

    resp = client.post('/user/save_profile_config',
        content_type='application/json',
        data=json.dumps({
            'id': '876',
            'config': '{"mynew": "config2"}',
            }))
    assert resp.status_code == 404

    resp = client.post('/user/save_profile_config',
        content_type='application/json',
        data=json.dumps({
            'id': '3',
            'config': '{"mynew": "config2"}',
            }))
    assert resp.status_code == 403

    resp = client.post('/user/save_profile_config',
        content_type='application/json',
        data=json.dumps({
            'id': '2',
            'config': '{"mynew": "config2"}',
            }))
    assert resp.status_code == 200

    with app.app_context():
        db = get_db()
        prof = db.execute("""
            SELECT * FROM profile
            WHERE id = 2
        """).fetchone()

        assert prof['name'] == 'My profile 2'
        assert prof['host'] == 'somehost2.com'
        assert prof['port'] == 1235
        assert prof['config'] == '{"mynew": "config2"}'