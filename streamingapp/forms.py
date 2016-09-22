# Forms

from django import forms
from .models import Streaming

class StreamingForm(forms.ModelForm):
    class Meta:
        model = Streaming
        fields = ['title', 'init_date', 'init_time', 'info']
        # Check Streaming model for all the fields needed to save the form