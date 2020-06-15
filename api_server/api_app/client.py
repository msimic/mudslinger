import smtplib
import uuid

from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for, current_app, abort
)

from api_app.db import get_db


bp = Blueprint('client', __name__, url_prefix='/client')


@bp.route('/migrate', methods=('GET', 'POST'))
def migrate():
    if request.method == 'GET':
        migr_id = request.args.get('migr_id')
        db = get_db();
        row = db.execute("""
            SELECT config FROM client_migrate
            WHERE id = ?
        """, (migr_id,)).fetchone()

        return {'config': row['config']}, 200

    elif request.method == 'POST':
        d = request.json
        if not d:
            return {'error': 'no json'}, 400

        if 'complete' in d:
            migr_id = d['migr_id']
            db = get_db()
            db.execute("""
                UPDATE client_migrate SET complete = 1
                WHERE id = ?
                """, (migr_id,))
            db.commit()
            return {}, 200

        else:
            if 'config' not in d:
                return {'error': 'missing config'}, 400

            new_uuid = str(uuid.uuid4())

            db = get_db()
            db.execute("""
                INSERT INTO client_migrate (id, config)
                VALUES (?,?)
            """, (
                new_uuid,
                d['config']))
            db.commit()

            return {'migr_id': new_uuid}, 200


@bp.route('/client_config', methods=('GET',))
def client_config():
    db = get_db()
    cfg = db.execute("SELECT * FROM client_config;").fetchone()
    cfg = dict(cfg)
    return cfg, 200


@bp.route('/contact', methods=('POST',))
def contact():
    d = request.json
    if not d:
        abort(400)

    if 'message' not in d:
        abort(400)

    if 'email' not in d:
        abort(400)

    if 'client_info' not in d:
        abort(400)

    sender = current_app.config['CONTACT_SMTP_SENDER']
    receivers = current_app.config['CONTACT_SMTP_RECEIVERS']
    email_msg = "From: {}\n".format(sender) + \
                "Subject: Mudslinger contact\n" + \
                "To: {}\n".format(",".join(receivers)) + \
                "\n" + str(d['message']) + \
                "\n\n" + \
                "\nemail = " + str(d['email']) + \
                "\nclient_info = " + str(d['client_info'])

    sent = False
    try:
        # assume localhost. Make it configurable later if needed
        o = smtplib.SMTP('localhost')
        o.sendmail(sender, receivers, email_msg)
        sent = True
    except Exception as ex:
        current_app.logger.error("Error sending email: " + str(ex))

    return {"sent": sent}, 200