# -*- coding: utf-8 -*-
# Generated by Django 1.9.9 on 2016-09-26 02:41
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('streamingapp', '0009_auto_20160925_2026'),
    ]

    operations = [
        migrations.AlterField(
            model_name='streaming',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
    ]