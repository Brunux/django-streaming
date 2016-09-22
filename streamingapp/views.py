import django.views.generic
from django.views.generic.edit import FormView
from .forms import StreamingForm
from streamingapp.models import Streaming

class Home(django.views.generic.TemplateView):
    template_name = "home.html"
    
    def get_context_data(self, **kwargs):
        context = super(Home, self).get_context_data(**kwargs)
        # laterd on filter strimings by date insted all.
        context['streamings'] = Streaming.objects.all()
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