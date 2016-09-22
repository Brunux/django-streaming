from django.db import models

# Create your models here.

class Streaming(models.Model):
    user = models.CharField(max_length=128)
    title = models.CharField(max_length=100)
    init_date = models.DateField(auto_now=False, auto_now_add=False)
    init_time = models.TimeField(auto_now=False, auto_now_add=False)
    uuid = models.UUIDField()
    info = models.TextField()
    # Add presentation field as optional
    
    def __str__(self):
        return self.title

# import uuid, datetime
# from streamingapp.models import Streaming
# stm = Streaming(user='bruno@virtuososcode.com', title='Meetup 12', init_date=datetime.date.today(), init_time=datetime.datetime.now().time(), uuid=uuid.uuid4(), info='Este es un streaming de prueba')
# time field >>> datetime.datetime.now().time()
# datetime.time(10, 22, 33, 999000)