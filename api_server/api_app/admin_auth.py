import functools

from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)
from werkzeug.security import check_password_hash, generate_password_hash

from api_app.db import get_db

bp = Blueprint('admin_auth', __name__, url_prefix='/admin_auth')


def admin_login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.admin_user is None:
            return redirect(url_for('admin_auth.admin_login'))

        return view(**kwargs)

    return wrapped_view


@bp.route('/admin_logout')
def admin_logout():
    session.clear()
    return redirect(url_for('admin.index'))


@bp.route('/admin_login', methods=('GET', 'POST'))
def admin_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        db = get_db()
        error = None
        admin_user = db.execute(
            'SELECT * FROM admin_user WHERE username = ?', (username,)
        ).fetchone()

        if admin_user is None:
            error = 'Incorrect username.'
        elif not check_password_hash(admin_user['password'], password):
            error = 'Incorrect password.'

        if error is None:
            session.clear()
            session['admin_user_id'] = admin_user['id']
            return redirect(url_for('admin.index'))

        flash(error)

    return render_template('auth/admin_login.html')


@bp.before_app_request
def load_logged_in_user():
    user_id = session.get('admin_user_id')

    if user_id is None:
        g.admin_user = None
    else:
        g.admin_user = get_db().execute(
            'SELECT * FROM admin_user WHERE id = ?', (user_id,)
        ).fetchone()
