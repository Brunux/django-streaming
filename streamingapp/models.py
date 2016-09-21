from django.db import models

# Create your models here.

class Streaming(models.Model):
    user_email = models.CharField(max_length=254)
    name = models.CharField(max_length=254)
    date = models.DateField(auto_now=False, auto_now_add=False)
    time = models.TimeField(auto_now=False, auto_now_add=False)
    uuid = models.UUIDField()
    info = models.TextField()
    
    def __str__(self):
        return self.name

# import uuid, datetime
# from streamingapp.models import Streaming
# stm = Streaming(user_email='bruno@virtuososcode.com', name='Meetup 12', date=datetime.date.today(), time=datetime.time(), uuid=uuid.uuid4(), info='Este es un streaming de prueba')