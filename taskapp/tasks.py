from __future__ import absolute_import
from taskapp.celery import app

@app.task
def deploy_server(is_public):
    return "Deploying Streaming, publico?: " + is_public