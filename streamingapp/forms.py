# Forms
# -*- coding: utf-8 -*-
from datetimewidget.widgets import DateWidget, TimeWidget
from django.utils.translation import ugettext_lazy as _
from django import forms
from .models import Streaming

class StreamingForm(forms.ModelForm):
    class Meta:
        model = Streaming
        fields = ['title', 'init_date', 'init_time', 'duration', 'info', 'is_public']
        widgets = {
            'title': forms.Textarea(attrs={'cols': 100, 'rows': 1, 'placeholder': 'Meetup Python: Web apps con Django'}),
            'info': forms.Textarea(attrs={'cols': 100, 'rows': 5, 'placeholder': 'En este streaming mostraremos como crear una aplicacion web usando Django framework'}),
            'init_date': DateWidget(attrs={'placeholder': 'AAAA-MM-DD', 'id': 'id_init_date'}, usel10n=True, bootstrap_version=3),
            'init_time': TimeWidget(attrs={'placeholder': 'HH-MM-SS','id': 'id_init_time'}, usel10n=True, bootstrap_version=3),
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