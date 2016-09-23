# Forms
# -*- coding: utf-8 -*-
from django.utils.translation import ugettext_lazy as _
from django import forms
from .models import Streaming
import uuid

class StreamingForm(forms.ModelForm):
    class Meta:
        model = Streaming
        fields = ['title', 'init_date', 'init_time', 'duration', 'info', 'is_public']
        widgets = {
            'title': forms.Textarea(attrs={'cols': 100, 'rows': 1}),
            'info': forms.Textarea(attrs={'cols': 100, 'rows': 5}),
        }
        labels = {
            'title': _('Titulo'),
            'init_date': _('Fecha de inicio'),
            'init_time': _('Hora de inicio'),
            'duration': _('Duracion'),
            'info': _('Descripcion'),
            'is_public': _('Es publico?'),
        }
        error_messages = {
            'title': {
                'max_length': _("El titulo es demasiado largo. Max 100 caracteres"),
            },
        }
        # Check Streaming model for all the fields needed to save the form