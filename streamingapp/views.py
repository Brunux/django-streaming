import django.views.generic
from django.views.generic.edit import FormView
from .forms import StreamingForm
from streamingapp.models import Streaming

class Home(django.views.generic.TemplateView):
    template_name = "home.html"
    
    def get_context_data(self, **kwargs):
        context = super(Home, self).get_context_data(**kwargs)
        # filter strimings by date
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
    # Check StreamingForm to set manually user_email and uuid fields
        form.save(commit=True)
        return super(StreamingCreateView, self).form_valid(form)
streamingCreateView = StreamingCreateView.as_view()

class StreamingView(django.views.generic.TemplateView):
    template_name = "streaming.html"
streamingView = StreamingView.as_view()
