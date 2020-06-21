import requests
import time
import datetime

from flask import (
    Blueprint, flash, g, redirect, render_template, request, url_for
)
from werkzeug.exceptions import abort

from api_app.admin_auth import admin_login_required
from api_app.db import get_db

bp = Blueprint('admin', __name__, url_prefix='/admin')


@bp.before_request
@admin_login_required
def _dummy():
    pass


@bp.route('/', methods=('GET',))
def index():
    return render_template('admin/index.html')


@bp.route('/client_config', methods=('GET',))
def client_config():
    db = get_db()
    cfg = db.execute("SELECT * FROM client_config").fetchone()
    cfg = dict(cfg)
    del cfg['id']

    return render_template(
        'admin/client_config.html',
        config=cfg)


@bp.route('/proxy_conn_monitor', methods=('GET',))
def proxy_conn_monitor():
    db = get_db()
    proxies = db.execute("SELECT * FROM telnet_proxies_web_admin").fetchall()
    conns = []

    nowtime = time.time()

    for row in proxies:
        url = row['url']
        
        try:
            resp = requests.get(url + '/conns')
        except Exception as ex:
            flash("Couldn't connect to " + url)
            continue
        if resp.status_code != 200:
            flash("Couldn't get /conns from " + url)
            continue
        for v in resp.json():
            entry = {
                'proxyUrl': url,
                'elapsed': datetime.timedelta(seconds=nowtime - v['startUTC']/1000)
                }
            entry.update(v)
            conns.append(entry)
        

    return render_template(
        'admin/proxy_conn_monitor.html',
        conns=conns,
        proxies=proxies)


@bp.route('/add_del_telnet_proxy_admin', methods=('POST',))
def add_del_telnet_proxy_admin():
    url = request.form['proxy-url']
    oper = request.form['oper']

    if oper not in ('add', 'del'):
        return '', 400
    
    db = get_db()
    error = None

    if oper == 'add':
        if db.execute(
            'SELECT 1 FROM telnet_proxies_web_admin '
            'WHERE url = ?', (url,)
        ).fetchone() is not None:
            error = 'That proxy is already registered.'

        if error is None:
            db.execute(
                'INSERT INTO telnet_proxies_web_admin (url) '
                'VALUES (?)',
                (url,)
            )
            db.commit()
            flash('Entry added.')
        else:
            flash(error)
        
        return redirect(url_for('admin.proxy_conn_monitor'))
    elif oper == 'del':
        if db.execute(
            'SELECT 1 FROM telnet_proxies_web_admin '
            'WHERE url = ?', (url,)
        ).fetchone() is None:
            error = 'No such proxy.'
        
        if error is None:
            db.execute(
                'DELETE FROM telnet_proxies_web_admin '
                'WHERE url = ?', (url,)
            )
            db.commit()
            flash('Entry deleted.')
        else:
            flash(error)

        return redirect(url_for('admin.proxy_conn_monitor'))
