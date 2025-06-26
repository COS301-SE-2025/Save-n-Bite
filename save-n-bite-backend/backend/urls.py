# myfirstproject/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('authentication.urls')),
    path('api/', include('food_listings.urls')),
    path('cart/',include('interactions.urls')),
    path('api/', include('notifications.urls')),
     path('api/', include('analytics.urls')),
    path('api/scheduling/', include('scheduling.urls')),
    path('api/', include('reviews.urls')),
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)