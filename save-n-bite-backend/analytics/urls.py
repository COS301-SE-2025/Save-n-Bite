from django.urls import path
from .views import BusinessAnalyticsView

urlpatterns = [
    path('business/', BusinessAnalyticsView.as_view(), name='business-analytics'),
]
