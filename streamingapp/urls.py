from django.conf.urls import url
from django.conf import settings
# This is just to serve file locally NO USE IN PRODUCCTION
from django.views.static import serve
from . import views

urlpatterns = [
    # A view named "home" is referenced in a few places.
    # Make sure to update the references if you change or delete this url line!
    url(r"^$", views.home, name="home"),
    url(r"^create-streaming/$", views.streaming_create_view, name="create-streaming"),
    url(r"^streaming/$", views.streaming_view, name="streaming"),
    url(r"[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}", views.streaming_view_linked, name="streaming-linked"),
    url(r"^done-create-streaming/$", views.done_create_streaming_view, name="done-create-streaming"),
    url(r"^send-email-guest/$", views.send_email_guest, name="send-email-guest"),
    url(r"^create-user/$", views.create_user, name="create-user"),
    url(r"^error/$", views.error_view, name="error-view"),
]

if settings.DEBUG:
    from httpproxy.views import HttpProxy
    from django.views.decorators.csrf import csrf_exempt
    urlpatterns += [
        url(r"^media/(?P<path>.*)$", serve, {'document_root': settings.MEDIA_ROOT,}),
        url(r"^janus/(?P<url>.*)$", csrf_exempt(HttpProxy.as_view(base_url='https://janus.conf.meetecho.com/janus',  rewrite=False))),
        ] # https://104.236.153.69:8889/janus/