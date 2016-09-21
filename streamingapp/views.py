import django.views.generic
from django.views.generic.edit import FormView
from .forms import StreamingForm

class Home(django.views.generic.TemplateView):
    template_name = "home.html"
home = Home.as_view()

class StreamingCreateView(FormView):
    template_name = "create-streaming.html"
    form_class = StreamingForm
    success_url = '/home/'
    
    def form_valid(self, form):
    # This method is called when valid form data has been POSTed.
    # It should return an HttpResponse.
        form.save(commit=True)
        return super(StreamingCreateView, self).form_valid(form)
streamingCreateView = StreamingCreateView.as_view()

class StreamingView(django.views.generic.TemplateView):
    template_name = "streaming.html"
streamingView = StreamingView.as_view()
