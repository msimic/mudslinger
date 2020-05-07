import sqlite3

import click
from flask import current_app, g
from flask.cli import with_appcontext


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row

    return g.db


def close_db(e=None):
    db = g.pop('db', None)

    if db is not None:
        db.close()


def migrate_db():
    db = get_db()

    old = None

    for i in range(10):
        curr_ver = db.execute("PRAGMA user_version").fetchone()[0]
        if old is None:
            old = curr_ver

        current_app.logger.info("Schema version is {}".format(curr_ver))

        target_ver = curr_ver + 1
        target_path = "migrations/{}.sql".format(target_ver)

        try:
            with current_app.open_resource(target_path) as f:
                db.executescript(f.read().decode('utf8'))
                db.executescript("PRAGMA user_version = {}".format(target_ver))
        except FileNotFoundError:
            break

    return old, curr_ver


def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.add_command(migrate_db_command)


@click.command('migrate-db')
@with_appcontext
def migrate_db_command():
    old, new = migrate_db()
    click.echo('Migrated DB from {} to {}'.format(old, new))
