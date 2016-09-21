# Forms

from django import forms
from .models import Streaming

class StreamingForm(forms.ModelForm):
    class Meta:
        model = Streaming
        fields = ['user_email', 'name', 'date', 'time', 'uuid', 'info']