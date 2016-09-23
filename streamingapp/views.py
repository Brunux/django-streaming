import django.views.generic
from django.views.generic.edit import FormView
from .forms import StreamingForm
from streamingapp.models import Streaming
import datetime

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
    success_url = '/home/'
    
    def form_valid(self, form):
    # This method is called when valid form data has been POSTed.
    # It should return an HttpResponse.
    # Check StreamingForm to set manually user_email and uuid fields.
        form.save(commit=True)
        return super(StreamingCreateView, self).form_valid(form)
streaming_create_view = StreamingCreateView.as_view()

# This should be used with the home form to access a streaming.
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


class DoneCreateStreamingView(django.views.generic.TemplateView):
    template_name = "done-create-streaming.html"
done_create_streaming_view = DoneCreateStreamingView.as_view()