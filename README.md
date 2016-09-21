# Django Skeleton

for Django 1.9. Should work with either Python 3.4 or 2.7 (3.4 is preferred)

## Features
Adds the following on top of Django's startproject template

* A set of starter html templates using bootstrap and jquery.

  * `base.html` is a minimal bootstrap template. It also shows any pending Django
    messages from the messages framework, and shows the currently logged-in
    user, and a link to logout.
  * `login.html` has a minimal login form
  * `logout.html` has a logout message and a link to log in again
  * `password_change.html` has a minimal password change form
  * `password_change_done.html` has a success message and a link to the
    'home' view

* A settings file split into a `common_settings.py` and `settings.ex.py`.
* Settings configured for a top-level static files directory
* Settings configured for a top-level templates directory
* Settings configured with a good default logging configuration
* Settings configured to auto-generate a secret key on first invocation
* A starter `.gitignore`
* A starter `requirements.txt`
* Defined urls for django built-in authentication views (login,
  logout, and password change) and settings configured to use them
  (`LOGIN_URL`, `LOGOUT_URL`, and `LOGIN_REDIRECT_URL`).

## Getting Started
The bare minimum to get a working project is:

1. Create a virtual environment and install the requirements listed in
   `requirements.txt`

   * In this directory, run `virtualenv -p /usr/bin/python3.4 env`
   * Now run `env/bin/pip install -r requirements.txt`
   * For convenience in later commands, activate your virtualenv for this
     terminal with `source ./env/bin/activate`. You can replace
     `./env/bin/python` with just `python` in subsequent commands in an
     activated environment.

2. Unless you want an app named "appname", change the app name in the following
   places:

   * The app directory name itself
   * In `common_settings.py` the INSTALLED_APPS setting
   * The import statement in the project-wide `urls.py`

3. In the project directory, copy the `settings.ex.py` to `settings.py`. No
   changes are needed for development. It is recommended to not check this
   file in to version control. As per our convention, settings common to all
   deployments go in `common_settings.py` which is checked in to version
   control. Deployment-specific settings go in `settings.py` which is not
   checked in to version control, or is checked in only on a
   deployment-specific branch.

   See the comments in settings.ex.py for more information.

4. Create your database and initial schemas with
   `./env/bin/python manage.py migrate`. The default database is a
   sqlite-based file in the base directory of your project.

5. You now have a working development environment. Run the django test server
   with `./env/bin/python manage.py runserver`

## About base.html

The base template is a simple bootstrap-based html template. It has 4 content
blocks to override in sub-templates:

* `header` is used to insert items into the header of the page, such as
  stylesheets.
* `content` is where all your content should go. It is placed inside a
  `<div>` with class `container`
* `scripts` is a block at the very end of the body, which can be used to
  insert javascript blocks.
* `title` overrides the document title.

## Notes

* A view named 'home' is referenced in the starter templates and in the
  `LOGIN_REDIRECT_URL` setting. If you change the home view to be named
  something else, make sure you update these references.

# Deployment Guide

Our usual setup is to use Nginx, Gunicorn, and Supervisor on production deployments. For this example we assume you are deploying your code to /opt/my-deployment-dir

1. Clone a copy of your code to /opt/my-deployment-dir. This should put your manage.py at /opt/my-deployment-dir/manage.py
1. Install Nginx and supervisor
2. Create a Python virtualenv and install your project’s dependencies + gunicorn into it. For this example the base dir is /opt/my-deployment-dir and the virtualenv is /opt/my-deployment-dir/env
3. Create a user and group for your code to run as. For this example we use project-user and project-group
4. Create a supervisor config in /etc/supervisord/myproject.ini containing:
   
   ```
   [program:myproject]
   directory = /opt/my-deployment-dir
   command = /opt/my-deployment-dir/env/bin/gunicorn --env DJANGO_SETTINGS_MODULE=project.settings --pythonpath /opt/my-deployment-dir/ --bind=unix:/opt/my-deployment-dir/gunicorn.sock project.wsgi
   stdout_logfile = /opt/my-deployment-dir/stdout.log
   redirect_stderr = true
   autostart = true
   autorestart = true
   user = project-user
   group = project-group
   ```

5. sudo systemctl restart supervisord
6. sudo supervisorctl status
7. Create an nginx config in /etc/nginx/conf.d/myproject.conf containing:

   ```
   upstream gunicorn {
       server unix:/opt/my-deployment-dir/gunicorn.sock fail_timeout=0;
   }

   server {
       listen 80;
       server_name my-hostname.oscar.ncsu.edu my-hostname.oscar.priv;
   
       location /static/ {
           alias /opt/my-deployment-dir/static-root/;
       }
       location / {
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header Host $http_host;
           proxy_redirect off;
           proxy_pass http://gunicorn;
       }
   }
   ```
8. Configure the django project for /opt/my-deployment-dir/static-root to be the STATIC_ROOT and run manage.py collectstatic
9. test ngix config with "sudo nginx -t"
10. restart nginx with "sudo nginx -s reload"
11. sudo systemctl enable nginx
12. sudo systemctl enable supervisord

## Deployment notes and tips:

* I like to make a git branch named for that deployment. For example, I may make a branch called "my-deployment.oscar.ncsu.edu" and check out that branch. Then I can continue to develop on the master branch, and merge changes into the deployment branch and follow the instructions below to update the deployment
* With the above technique, I can check in any deployment-specific files such as settings.py to keep revisions and backups of critical files. Only push changes back if the remote repository is not public or if there are no secrets (such as db passwords) being checked in.
* By default, Supervisor rotates the stdout log file after 50 megabytes and
  keeps 10 past backups. You may consider tweaking these parameters in the
  supervisor config.

  For some situations, it's more appropriate to change Python's logging
  configuration to have Python log to a file instead of stderr so that Python
  can handle the log rotation instead of supervisor (using the
  RotatingFileHandler or TimedRotatingFileHandler). You will need to decide
  for yourself which makes the most sense for your situation.

  It usually makes sense to have supervisor perform the logging, so any
  erroneous writes to stdout or stderr by python outside of the logging
  system go to the same file. On the other hand, you may want to
  separate them if you want your log files in a consistent format, and you're
  using some library that's being rude and doing its own writing to stderr
  instead of using python logging.

## Deploying Changes

To update a deployment with new changes:

1. cd to /opt/my-deployment-dir
2. run "git pull --ff-only". In general, you don't want to be doing any committing or merging out of the deployment working copy.
3. run "./env/bin/python manage.py migrate" to update the database with any new schema changes
4. run "./env/bin/python manage.py collectstatic" to update the static files
5. run "sudo supervisorctl restart all" to restart all running gunicorn processes
