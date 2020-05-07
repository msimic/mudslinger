import uuid
import click
from itsdangerous import JSONWebSignatureSerializer, BadSignature
from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for, current_app, abort
)
from flask_httpauth import HTTPBasicAuth
from flask.cli import with_appcontext

from api_app.db import get_db


bp = Blueprint('usage', __name__, url_prefix='/usage')


# We will get game connect/disconnect events from the telnet proxy server(s), which 
# we can authenticate with generated tokens for security
# https://blog.miguelgrinberg.com/post/restful-authentication-with-flask
tn_proxy_auth = HTTPBasicAuth()


@tn_proxy_auth.verify_password
def tn_proxy_verify_password(token, _):
    client_id = verify_tn_proxy_token(token)
    if not client_id:
        return False
    g.tn_proxy_client_id = client_id
    return True


def gen_tn_proxy_token(client_id):
    s = JSONWebSignatureSerializer(current_app.config['SECRET_KEY'])
    token = s.dumps({ 'client_id': client_id })
    return token


def verify_tn_proxy_token(token):
    s = JSONWebSignatureSerializer(current_app.config['SECRET_KEY'])
    try:
        data = s.loads(token)
    except BadSignature:
        return None
    client_id = data['client_id']
    return client_id


@click.command('gen-tn-proxy-token')
@click.argument('client_id')
@with_appcontext
def gen_tn_proxy_token_command(client_id):
    token = gen_tn_proxy_token(client_id)
    click.echo('client_id: ' + str(client_id))
    click.echo('token: ' + str(token))


def init_app(app):
    app.cli.add_command(gen_tn_proxy_token_command)


@bp.route('/connect', methods=('POST',))
@tn_proxy_auth.login_required
def tn_proxy_connect():
    print("Got connect from " + str(g.tn_proxy_client_id))
    d = request.json

    if not d:
        abort(400)

    for field in ('sid', 'from_addr', 'to_addr', 'to_port', 'time_stamp'):
        if field not in d:
            abort(400)

    new_uuid = str(uuid.uuid4())

    db = get_db()
    db.execute("""
        INSERT INTO usage_connect (
            uuid, tn_proxy_client_id, sid, from_addr, to_addr, to_port, time_stamp
        ) VALUES (?,?,?,?,?,?,?)
    """, (
        new_uuid,
        g.tn_proxy_client_id,
        d['sid'],
        d['from_addr'],
        d['to_addr'],
        d['to_port'],
        d['time_stamp']))
    db.commit()
    return { 'uuid': new_uuid }, 200


@bp.route('/disconnect', methods=('POST',))
@tn_proxy_auth.login_required
def tn_proxy_disconnect():
    print("Got disconnect from " + str(g.tn_proxy_client_id))
    d = request.json
    if not d:
        abort(400)

    for field in ('sid', 'from_addr', 'to_addr', 'to_port', 'time_stamp', 'elapsed_ms'):
        if field not in d:
            print("No " + str(field))
            abort(400)

    db = get_db()
    db.execute("""
        INSERT INTO usage_disconnect (
            uuid, tn_proxy_client_id, sid, from_addr, to_addr, to_port,
            time_stamp, elapsed_ms
        ) VALUES (?,?,?,?,?,?,?,?)
    """, (
        d['uuid'],
        g.tn_proxy_client_id,
        d['sid'],
        d['from_addr'],
        d['to_addr'],
        d['to_port'],
        d['time_stamp'],
        d['elapsed_ms']))
    db.commit()
    return {}, 200


@bp.route('/mxp_send', methods=('POST',))
def mxp_send():
    d = request.json
    if not d:
        abort(400)

    if 'time_stamp' not in d:
        abort(400)

    db = get_db()
    db.execute("""
        INSERT INTO usage_mxp_send (
            sid, from_addr, to_addr, to_port, time_stamp
        ) VALUES (?,?,?,?,?)
    """, (
        d.get('sid'),
        d.get('from_addr'),
        d.get('to_addr'),
        d.get('to_port'),
        d.get('time_stamp')))
    db.commit()
    return {}, 200
