from __future__ import absolute_import
from taskapp.celery import app


# This will interact with the DigitalOcean API
# Create de Droplet
@app.task
def deploy_server(uuid):
    return "Deploying Streaming ID: " + str(uuid)

#Killing de Droplet
@app.task
def kill_server(uuid):
    return "Killing Streaming ID:" + str(uuid)
