# -*- coding: utf-8 -*-
# Generated by Django 1.9.9 on 2016-09-25 23:36
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('streamingapp', '0007_auto_20160925_1817'),
    ]

    operations = [
        migrations.AddField(
            model_name='streaming',
            name='image',
            field=models.ImageField(default=b'media/defualt.png', upload_to=b'streaming_images'),
        ),
    ]
