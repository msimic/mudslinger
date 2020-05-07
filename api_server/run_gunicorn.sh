#!/usr/bin/env bash
set -e
source config.gunicorn
gunicorn -w 1 -b "$API_APP_GUNICORN_HOST":"$API_APP_GUNICORN_PORT" wsgi:app >> gunicorn_log.txt 2>&1 &

