# VC-streaming-app
Virtuososcode Streaming Web Application

## Instructions
Clone repo
``` bash
    $ git clone https://github.com/Brunux/django-streaming.git; cd django-streaming
```

Install python-2.7 Virtual Environment tool
``` bash
    $ pip install virtualenv
```
Create a Virtual Environment
``` bash
    $ virtualenv venv
```
Activate your new Virtual Environment
``` bash
    $ source venv/bin/activate
```
Install dependencies
``` bash
    $ pip install -r requirements.txt
```
Configure your own settings.py
``` bash
    $ vim project/settings.py
    ... (this is going to be empty)
    ... (Configure you own settings here)
    ... (save)
```
Prepare the DB by doing magrations
``` bash
    $ python manage.py migrate
```
Add an admin user
``` bash
    $ python manage.py createsuperuser
    ...
```
Run development server
``` bash
    $ python manage.py runserver 0.0.0.0:8080
```
Finally, point your web browser to [http://localhost:8080](http://localhost:8080)

And optionally you could activate email functions, please check `project/common_settings.py` file and uncomment lines
```
# Send mail, set this as enviroment virables at /home/[user]/.profile

#EMAIL_HOST = os.environ['EMAIL_HOST']
#EMAIL_PORT = os.environ['EMAIL_PORT']
#EMAIL_HOST_USER = os.environ['EMAIL_HOST_USER']
#EMAIL_HOST_PASSWORD = os.environ['EMAIL_HOST_PASSWORD']
#EMAIL_USE_TLS = os.environ['EMAIL_USE_TLS']
```
And activate sendmail by uncommente line `#msg.send()` at `streamingapp/views.py`
```
    ...
    msg = EmailMessage(subject, message, to=to, from_email=from_email)
    msg.content_subtype = 'html'
    #msg.send()
    ...
```
