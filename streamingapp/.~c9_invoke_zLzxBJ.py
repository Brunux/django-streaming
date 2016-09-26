# -*- coding: utf-8 -*-

import django.views.generic
from django.views.generic.edit import FormView
from .forms import StreamingForm
from .models import Streaming
from django.shortcuts import redirect
from django.http import HttpResponse
import datetime, uuid
import re

from django.template.loader import get_template
from django.core.mail import EmailMessage

# Send email
def send_email(streaming):
    subject = "Confirmación de Streaming virtuososcode"
    to = [str(streaming.user)]
    from_email = 'hola@virtuososcode.com'

    ctx = {
        'uuid': str(streaming.uuid),
        'title': str(streaming.title),
        'init_date': str(streaming.init_date),
        'init_time': str(streaming.init_time),
        'user': str(streaming.user),
        'url': 'https://streaming.virtuososcode.com/' + str(streaming.uuid)
        }
    
    message = get_template('email.html').render(ctx)
    msg = EmailMessage(subject, message, to=to, from_email=from_email)
    msg.content_subtype = 'html'
    #msg.send()
    print message


class Home(django.views.generic.TemplateView):
    template_name = "home.html"
    
    def get_context_data(self, **kwargs):
        context = super(Home, self).get_context_data(**kwargs)
        # Streamings filter by today
        streamings = Streaming.objects.filter(init_date=datetime.date.today())
        
        if len(streamings) == 1:
            if len(streamings[0].title) > 50:
                    streamings[0].title = streamings[0].title[:50] + " ..."
            context['streaming'] = streamings[0]
        
        elif len(streamings) > 1:
            for streaming in streamings:
                if len(streaming.title) > 50:
                    streaming.title = streaming.title[:50] + " ..."
            context['streamings'] = streamings
        
        return context
home = Home.as_view()

class StreamingCreateView(FormView):
    template_name = "create-streaming.html"
    form_class = StreamingForm
    success_url = '/done-create-streaming/'
    
    duration = False

    def form_valid(self, form):
        import pdb; pdb.set_trace()
        # This method is called when valid form data has been POSTed.
        # It should return an HttpResponse.
        # Check StreamingForm to set manually user_email and uuid fields.
        if form.cleaned_data['duration'] == '1':
            duration = datetime.time(1,0)
        elif form.cleaned_data['duration'] == '30':
            duration = datetime.time(0,30)
        elif form.cleaned_data['duration'] == '15':
            duration = datetime.time(0,15)
        else:
            duration = False
        
        if duration and self.request.user.is_authenticated():
            streaming = Streaming(
                    user = self.request.user,
                    title = form.cleaned_data['title'],
                    init_date = form.cleaned_data['init_date'],
                    init_time = form.cleaned_data['init_time'],
                    duration = duration,
                    uuid = uuid.uuid4(),
                    info = form.cleaned_data['info'],
                    is_public = form.cleaned_data['is_public'],
                    image = form.cleaned_data['image']
                )
            streaming.save()
            
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

# AJAX
def send_email_guest(request):
    email = request.GET.get('email', None)
    uuid = request.GET.get('uuid', None)
    
    # Get streaming from uuid
    streaming = Streaming.objects.get(uuid=uuid)
    
    # match any valid email
    pattern = re.compile('^[^@\\s]+@([^@\\s]+\\.)+[^@\\s]+$')
    
    if (type(pattern.match(email)) == type(pattern.match('email@email.com'))):
        send_email(streaming)
        return HttpResponse(email)
    else:
        return HttpResponse('No hacking dude!')

