# reviews/urls.py

from django.urls import path
from . import views

app_name = 'reviews'

urlpatterns = [
    # User review endpoints
    path('reviews/create/', views.create_review, name='create_review'),
    path('reviews/<uuid:review_id>/update/', views.update_review, name='update_review'),
    path('reviews/<uuid:review_id>/delete/', views.delete_review, name='delete_review'),
    path('reviews/my-reviews/', views.get_user_reviews, name='get_user_reviews'),
    path('reviews/summary/', views.get_user_review_summary, name='get_user_review_summary'),
    
    # Interaction review status
    # path('interactions/<uuid:interaction_id>/review-status/', views.check_interaction_review_status, name='check_interaction_review_status'),
    # path('interactions/<uuid:interaction_id>/review/', views.get_interaction_review, name='get_interaction_review'),
    
    # Business review endpoints (for food providers)
    path('business/reviews/', views.get_business_reviews, name='get_business_reviews'),
    path('business/reviews/stats/', views.get_business_review_stats, name='get_business_review_stats'),
    
 
    # Admin moderation endpoints
    path('admin/reviews/', views.get_all_reviews_admin, name='get_all_reviews_admin'),
    path('admin/reviews/<uuid:review_id>/moderate/', views.moderate_review, name='moderate_review'),
    path('admin/reviews/<uuid:review_id>/logs/', views.get_moderation_logs, name='get_moderation_logs'),
    path('admin/reviews/analytics/', views.get_review_analytics_admin, name='get_review_analytics_admin'),
]