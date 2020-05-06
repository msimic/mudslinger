#!/usr/bin/env bash
set -e
if [ "$1" == "restart" ]
then
    touch wsgi.py
else
    source config.gunicorn
    gunicorn --reload -w 1 -b "$API_APP_GUNICORN_HOST":"$API_APP_GUNICORN_PORT" wsgi:app >> gunicorn_log.txt 2>&1 &
fi

