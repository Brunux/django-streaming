# -*- coding: utf-8 -*-
# Generated by Django 1.9.9 on 2016-09-29 15:43
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('streamingapp', '0015_streaming_droplet'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='streaming',
            name='droplet',
        ),
    ]
