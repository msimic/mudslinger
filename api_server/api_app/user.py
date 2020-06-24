import requests
import time
import datetime

from flask import (
    Blueprint, flash, g, redirect, render_template, request, url_for
)
from werkzeug.exceptions import abort

from api_app.auth import login_required
from api_app.db import get_db

bp = Blueprint('user', __name__, url_prefix='/user')


@login_required
@bp.route('/profiles', methods=('GET',))
def profiles():
    db = get_db()
    profiles = db.execute("""
        SELECT * FROM profile
        WHERE user_id = ?
    """, (g.user['id'],))

    return render_template(
        'user/profiles.html',
        profiles=profiles)


@login_required
@bp.route('/create_profile', methods=('GET', 'POST'))
def create_profile():
    if request.method == 'POST':
        name = request.form['name'].strip()
        host = request.form['host'].strip()
        port = request.form['port'].strip()

        error = None

        if not name:
            error = 'Profile name is required'
        elif not host:
            error = 'Host is required'
        elif not port:
            error = 'Port is required'
        else:
            try:
                port = int(port)
            except ValueError:
                error = 'Port must be an integer'

        if error is not None:
            flash(error)
        else:
            db = get_db()
            db.execute("""
                INSERT INTO profile (user_id, name, host, port)
                VALUES (?,?,?,?)
            """, (g.user['id'], name, host, port))
            db.commit()
            return redirect(url_for('user.profiles'))

    return render_template('user/create_profile.html')


@login_required
@bp.route('/<int:pr_id>/edit_profile', methods=('GET', 'POST'))
def edit_profile(pr_id):
    db = get_db()
    profile = db.execute("""
        SELECT * FROM profile
        WHERE id = ?
    """, (pr_id,)).fetchone()

    if not profile:
        abort(404)

    if profile['user_id'] != g.user['id']:
        abort(403)

    if request.method == 'POST':
        name = request.form['name'].strip()
        host = request.form['host'].strip()
        port = request.form['port'].strip()

        error = None

        if not name:
            error = 'Profile name is required'
        elif not host:
            error = 'Host is required'
        elif not port:
            error = 'Port is required'
        else:
            try:
                port = int(port)
            except ValueError:
                error = 'Port must be an integer'

        if error is not None:
            flash(error)
        else:
            db = get_db()
            db.execute("""
                UPDATE profile
                SET
                    name = ?,
                    host = ?,
                    port = ?
                WHERE id = ?
            """, (name, host, port, g.user['id']))
            db.commit()
            return redirect(url_for('user.profiles'))

    return render_template('user/edit_profile.html', profile=profile)


@login_required
@bp.route('/<int:pr_id>/delete_profile', methods=('POST',))
def delete_profile(pr_id):
    db = get_db()
    profile = db.execute("""
        SELECT * FROM profile
        WHERE id = ?
    """, (pr_id,)).fetchone()

    if not profile:
        abort(404)

    if profile['user_id'] != g.user['id']:
        abort(403)

    db.execute("DELETE FROM profile WHERE id = ?", (pr_id,))
    db.commit()

    return redirect(url_for('user.profiles'))


@bp.route('/get_profile', methods=('GET',))
def get_profile():
    if g.user is None:
        abort(403)

    if 'id' not in request.args:
        abort(400)

    pr_id = request.args['id']

    db = get_db()
    profile = db.execute("""
        SELECT * FROM profile
        WHERE id = ?
    """, (pr_id,)).fetchone()

    if not profile:
        abort(404)

    if profile['user_id'] != g.user['id']:
        abort(403)

    return dict(profile), 200


@bp.route('/save_profile_config', methods=('POST',))
def save_profile_config():
    if g.user is None:
        abort(403)

    d = request.json
    if not d:
        abort(400)

    if 'id' not in d:
        abort(400)

    if 'config' not in d:
        abort(400)

    pr_id = d['id']
    config = d['config']

    db = get_db()
    profile = db.execute("""
        SELECT * FROM profile
        WHERE id = ?
    """, (pr_id,)).fetchone()

    if profile is None:
        abort(404)

    if profile['user_id'] != g.user['id']:
        abort(403)

    db.execute("""
        UPDATE profile
        SET config = ?
        WHERE id = ?
    """, (config, pr_id))
    db.commit()

    return {}, 200
