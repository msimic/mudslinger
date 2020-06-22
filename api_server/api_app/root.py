import requests
import time
import datetime

from flask import (
    Blueprint, flash, g, redirect, render_template, request, url_for
)
from werkzeug.exceptions import abort

from api_app.auth import login_required
from api_app.db import get_db

bp = Blueprint('root', __name__)



@bp.route("/")
def index():
    return render_template('index.html')

