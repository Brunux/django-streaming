# -*- coding: utf-8 -*-
# Generated by Django 1.9.9 on 2016-09-22 21:59
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('streamingapp', '0004_auto_20160922_1542'),
    ]

    operations = [
        migrations.AddField(
            model_name='streaming',
            name='is_public',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='streaming',
            name='title',
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name='streaming',
            name='user',
            field=models.CharField(max_length=128),
        ),
    ]