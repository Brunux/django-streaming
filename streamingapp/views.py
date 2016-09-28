# -*- coding: utf-8 -*-

import django.views.generic
from django.views.generic.edit import FormView, CreateView
from .forms import StreamingForm, UserCreateForm
from .models import Streaming
from django.shortcuts import redirect
from django.http import HttpResponse
from datetime import time
from django.utils import timezone
import re, uuid

from django.template.loader import get_template
from django.core.mail import EmailMessage

from django.contrib.auth.models import User
from  django.contrib.auth import hashers

from taskapp.tasks import deploy_server

# Check valid email
def check_email(email):
    PATTERN = re.compile('^[^@\\s]+@([^@\\s]+\\.)+[^@\\s]+$')
    return PATTERN.match(email)

# Check Strong password
def check_pass(password):
    PATTERN = re.compile('[A-Za-z0-9@#$%^&+=]{8,}')
    return PATTERN.match(password)

# Convert Time Delta
def hours_minutes(td):
    return td.seconds//3600, (td.seconds//60)%60

# Send email
def send_email(streaming):
    site = "compartoskill.com"
    subject = "Confirmación de Streaming CompartoSkill"
    to = [str(streaming.user)]
    from_email = 'hola@' + site

    ctx = {
        'uuid': str(streaming.uuid),
        'title': str(streaming.title),
        'init_date': str(streaming.init_datetime.date()),
        'init_time': str(streaming.init_datetime.time()),
        'user': str(streaming.user),
        'url': 'https://' + site + str(streaming.uuid)
        }
    
    message = get_template('email.html').render(ctx)
    try:
        msg = EmailMessage(subject, message, to=to, from_email=from_email)
        msg.content_subtype = 'html'
        #msg.send()
        print message
    except:
        return HttpResponse('Request Error')

class Home(django.views.generic.TemplateView):
    template_name = "home.html"
    
    def get_context_data(self, **kwargs):
        context = super(Home, self).get_context_data(**kwargs)
        # Streamings filter by today
        streamings = Streaming.objects.filter(init_date=timezone.now().date())
        if len(streamings) == 0:
            context['streaming'] = False
            context['streamings'] = False
            context['time_to_init'] = False
        elif len(streamings) == 1:
            if (streamings[0].init_datetime - timezone.now()).total_seconds() > 0:
                context['streaming'] = streamings[0]
                
                hours, minutes = hours_minutes(streamings[0].init_datetime - timezone.now())
                context['streaming'].time_to_init = {'hours': hours , 'minutes': minutes} 
                
                context['streamings'] = False
            if len(streamings[0].title) > 50:
                streamings[0].title = streamings[0].title[:50] + " ..."
        
        elif len(streamings) > 1:
            x = 0
            context['streamings'] = []
            for streaming in streamings:
                if (streaming.init_datetime - timezone.now()).total_seconds() > 0:
                    context['streamings'].insert(x, streaming)
                    
                    hours, minutes = hours_minutes(streaming.init_datetime - timezone.now())
                    context['streamings'][x].time_to_init = {'hours': hours , 'minutes': minutes}
                    
                    if len(streaming.title) > 50:
                        context['streamings'][x].title = streaming.title[:50] + " ..."
                    x += 1
            x = 0
        return context
home = Home.as_view()

class StreamingCreateView(FormView):
    template_name = "create-streaming.html"
    form_class = StreamingForm
    success_url = '/done-create-streaming/'
    
    duration = False

    def form_valid(self, form):
        # This method is called when valid form data has been POSTed.
        # It should return an HttpResponse.
        # Check StreamingForm to set manually user_email and uuid fields.
        if form.cleaned_data['duration'] == '1':
            duration = time(1,0)
        elif form.cleaned_data['duration'] == '30':
            duration = time(0,30)
        elif form.cleaned_data['duration'] == '15':
            duration = time(0,15)
        else:
            duration = False
        
        if duration and self.request.user.is_authenticated():
            try:
                time_to_init = form.cleaned_data['init_datetime'] - timezone.now()
                server = deploy_server.apply_async((form.cleaned_data['uuid'],), countdown=int(time_to_init.total_seconds()))
                streaming = Streaming(
                        user = self.request.user,
                        title = form.cleaned_data['title'],
                        init_datetime = form.cleaned_data['init_datetime'],
                        init_date = form.cleaned_data['init_datetime'].date(),
                        duration = duration,
                        uuid = uuid.UUID(server.id),
                        info = form.cleaned_data['info'],
                        is_public = form.cleaned_data['is_public'],
                        image = form.cleaned_data['image']
                    )
                streaming.save()
                import pdb; pdb.set_trace()
            except:
                return redirect(error_view)
            # Send email
            send_email(streaming)
            
            # saving data to be send to success url
            self.request.session['uuid'] = str(streaming.uuid)
            self.request.session['title'] = str(streaming.title)
            self.request.session['init_date'] = str(streaming.init_datetime.date())
            self.request.session['init_time'] = str(streaming.init_datetime.time())
            self.request.session['user'] = str(streaming.user)

            return super(StreamingCreateView, self).form_valid(form)
        return redirect(error_view)
streaming_create_view = StreamingCreateView.as_view()

# This should be used with the home form to access a streaming with a given uuid.
class StreamingView(django.views.generic.TemplateView):
    template_name = "streaming.html"
streaming_view = StreamingView.as_view()

# This should be used with the home streamings links avalables to access the
# selected streaming.
class StreamingViewLinked(django.views.generic.TemplateView):
    template_name = "streaming.html"
    
    def get_context_data(self, **kwargs):
        context = super(StreamingViewLinked, self).get_context_data(**kwargs)
        # Need to get streaming object by URL to pass to the template tags,
        # check URL dispatcher docs.
        context['streaming'] = Streaming.objects.get(uuid=self.request.path.replace("/",""))
        return context
streaming_view_linked = StreamingViewLinked.as_view()

# This should be used to render a successful streaming added
class DoneCreateStreamingView(django.views.generic.TemplateView):
    template_name = "done-create-streaming.html"
    context_object_name = 'streaming'

done_create_streaming_view = DoneCreateStreamingView.as_view()

# This should be used to display all posible errors
class ErrorView(django.views.generic.TemplateView):
    template_name = "error.html"
error_view = ErrorView.as_view()


# AJAX Requests
def send_email_guest(request):
    try:
        email = request.GET.get('email', None)
        uuid = request.GET.get('uuid', None)
        
        # Get streaming from uuid.
        streaming = Streaming.objects.get(uuid=uuid)
    except:
        return HttpResponse('Request Error')
    else:
        if type(check_email(email)) == type(check_email('user@email.com')):
            send_email(streaming)
            return HttpResponse(email)
        else:
            return HttpResponse('No hacking dude!')

class CreateUser(FormView):
    template_name = "create-user.html"
    form_class = UserCreateForm
    success_url = '/accounts/login'
    
    def form_valid(self, form):
        # This method is called when valid form data has been POSTed.
        # It should return an HttpResponse.
        try:
            if form.cleaned_data['password1'] == form.cleaned_data['password2']:
                if type(check_email(form.cleaned_data['email'])) == type(check_email('user@email.com')):
                    if not User.objects.filter(username=form.cleaned_data['username']):
                        password_gen = hashers.make_password(form.cleaned_data['password1'])
                        user = User(username=form.cleaned_data['username'], email=form.cleaned_data['email'], password=password_gen)
                        user.save()
                else:
                    return redirect(error_view)
            else:
                return redirect(error_view)
        except:
            return redirect(error_view)
        return super(CreateUser, self).form_valid(form)
create_user = CreateUser.as_view()