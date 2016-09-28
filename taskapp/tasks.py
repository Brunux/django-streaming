from __future__ import absolute_import
from taskapp.celery import app

@app.task
def deploy_server(uuid):
    return "Deploying Streaming ID: " + str(uuid)