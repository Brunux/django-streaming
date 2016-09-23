from django.conf.urls import url

from . import views

urlpatterns = [
    # A view named "home" is referenced in a few places.
    # Make sure to update the references if you change or delete this url line!
    url(r"^$", views.home, name="home"),
    url(r"^create-streaming/$", views.streaming_create_view, name="create-streaming"),
    url(r"^streaming/$", views.streaming_view, name="streaming"),
    url(r"[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}", views.streaming_view_linked, name="streaming-linked"),
    url(r"^done-create-streaming/$", views.done_create_streaming_view, name="done-create-streaming"),
    url(r"^error/$", views.error_view, name="error-view")
]
