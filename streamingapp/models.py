from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Streaming(models.Model):
    ONE = '1'
    HALF = '30'
    QUARTER = '15'
    DURATION_CHOICES = (
        (ONE, "1 Hora"),
        (HALF, "30 Minutos"),
        (QUARTER, "15 Minutos"),
    )
    
    user = models.ForeignKey(User)
    title = models.CharField(max_length=128)
    init_datetime = models.DateTimeField(auto_now=False, auto_now_add=False)
    init_date = models.DateField(auto_now=False, auto_now_add=False)
    duration = models.CharField(
        max_length=2,
        choices=DURATION_CHOICES,
        default=HALF,
    )
    uuid = models.UUIDField()
    droplet = models.TextField()
    info = models.TextField()
    is_public = models.BooleanField(default=True)
    image = models.ImageField(upload_to='streaming_images',
                                default='default.png')
    # Add presentation field as optional
    
    def __str__(self):
        return self.title

# import uuid, datetime
# from streamingapp.models import Streaming
# stm = Streaming(user='bruno@virtuososcode.com', title='Meetup 12', init_date=datetime.date.today(), init_time=datetime.datetime.now().time(), uuid=uuid.uuid4(), info='Este es un streaming de prueba' is_public=True)
# time field >>> datetime.datetime.now().time()
# datetime.time(10, 22, 33, 999000)