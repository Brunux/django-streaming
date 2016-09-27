# -*- coding: utf-8 -*-

import django.views.generic
from django.views.generic.edit import FormView, CreateView
from .forms import StreamingForm
from .models import Streaming
from django.shortcuts import redirect
from django.http import HttpResponse
from uuid import uuid4
from datetime import time, date
import re

from django.template.loader import get_template
from django.core.mail import EmailMessage

from django.contrib.auth.models import User

# Check valid email
def check_email(email):
    PATTERN = re.compile('^[^@\\s]+@([^@\\s]+\\.)+[^@\\s]+$')
    return PATTERN.match(email)

# Check Strong password
def check_pass(password):
    PATTERN = re.compile('[A-Za-z0-9@#$%^&+=]{8,}')
    return PATTERN.match(password)

# Send email
def send_email(streaming):
    site = "compartoskill.com"
    subject = "Confirmación de Streaming CompartoSkill"
    to = [str(streaming.user)]
    from_email = 'hola@' + site

    ctx = {
        'uuid': str(streaming.uuid),
        'title': str(streaming.title),
        'init_date': str(streaming.init_date),
        'init_time': str(streaming.init_time),
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
        streamings = Streaming.objects.filter(init_date=date.today())
        
        if len(streamings) == 0:
            context['streaming'] = False
            context['streamings'] = False
        elif len(streamings) == 1:
            if len(streamings[0].title) > 50:
                    streamings[0].title = streamings[0].title[:50] + " ..."
            context['streaming'] = streamings[0]
            context['streamings'] = False
        
        elif len(streamings) > 1:
            for streaming in streamings:
                if len(streaming.title) > 50:
                    streaming.title = streaming.title[:50] + " ..."
            context['streamings'] = streamings
            context['streaming'] = False
        
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
                streaming = Streaming(
                        user = self.request.user,
                        title = form.cleaned_data['title'],
                        init_date = form.cleaned_data['init_date'],
                        init_time = form.cleaned_data['init_time'],
                        duration = duration,
                        uuid = uuid4(),
                        info = form.cleaned_data['info'],
                        is_public = form.cleaned_data['is_public'],
                        image = form.cleaned_data['image']
                    )
                streaming.save()
            except:
                return redirect(error_view)
            # Send email
            send_email(streaming)
            
            # saving data to be send to success url
            self.request.session['uuid'] = str(streaming.uuid)
            self.request.session['title'] = str(streaming.title)
            self.request.session['init_date'] = str(streaming.init_date)
            self.request.session['init_time'] = str(streaming.init_time)
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
        if (type(check_email(email)) == type(check_email('user@email.com'))):
            send_email(streaming)
            return HttpResponse(email)
        else:
            return HttpResponse('No hacking dude!')

class CreateUser(CreateView):
    model = User
    fields = ['username', 'email', 'password']
    
    success_url = '/accounts/login'
    
    def render_to_response(self, context, **response_kwargs):
 
        response_kwargs.setdefault('content_type', self.content_type)
        return self.response_class(
            request=self.request,
            template=get_template('create-user.html'),
            context=context,
            using=self.template_engine,
            **response_kwargs
            )
create_user = CreateUser.as_view()
