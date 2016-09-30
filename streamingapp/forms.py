# Forms
# -*- coding: utf-8 -*-
from datetimewidget.widgets import DateWidget, TimeWidget, DateTimeWidget
from django.utils.translation import ugettext_lazy as _
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .models import Streaming

class StreamingForm(forms.ModelForm):
    class Meta:
        model = Streaming
        fields = ['title', 'init_datetime', 'duration', 'info', 'is_public', 'image']
        widgets = {
            'title': forms.Textarea(attrs={"rows": 1, "class": "form-control", 'placeholder': 'Meetup Python: Web apps con Django'}),
            'info': forms.Textarea(attrs={"rows": 5, "class": "form-control", 'placeholder': 'En este streaming mostraremos como crear una aplicacion web usando Django framework'}),
            'init_datetime': DateTimeWidget(options={"format": "yyyy/mm/dd hh:ii:ss"}, attrs={'placeholder': 'AAAA-MM-DD hh:mm:ss','id': 'id_init_datetime'}, usel10n=True, bootstrap_version=3),
        }
        labels = {
            'title': _('Titulo'),
            'init_datetime': _('Inicia'),
            'duration': _('Duracion'),
            'info': _('Descripcion'),
            'is_public': _('Es publico?'),
        }
        error_messages = {
            'title': {
                'max_length': _("El titulo es demasiado largo. Max 128 caracteres"),
            },
        }
        # Check Streaming model for all the fields needed to save the form
        

class UserCreateForm(UserCreationForm):
    class Meta:
        model = User
        fields = ["username", "email"]

        labels = {
            'username': _('Nombre de Usuario'),
            'email': _('Email'),
            'password1': _('Contraseña'),
            'password2': _('Repetir Contraseña')
        }