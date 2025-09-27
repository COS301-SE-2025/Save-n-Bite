# digital_garden/urls.py

from django.urls import path, include
from . import views

app_name = 'digital_garden'

urlpatterns = [
    # Garden management
    path('garden/', views.GardenView.as_view(), name='garden'),
    path('garden/summary/', views.GardenSummaryView.as_view(), name='garden-summary'),
    
    # Plant inventory
    path('inventory/', views.PlantInventoryView.as_view(), name='plant-inventory'),
    
    # Plant catalog
    path('plants/', views.PlantCatalogView.as_view(), name='plant-catalog'),
    path('plants/<uuid:plant_id>/', views.PlantDetailView.as_view(), name='plant-detail'),
    path('plants/rarities/', views.garden_rarities, name='plant-rarities'),
    path('plants/categories/', views.garden_categories, name='plant-categories'),
    
    # Garden actions
    path('actions/place/', views.PlantPlacementView.as_view(), name='place-plant'),
    path('actions/remove/', views.PlantRemovalView.as_view(), name='remove-plant'),
    path('actions/move/', views.PlantMoveView.as_view(), name='move-plant'),
    path('actions/bulk/', views.BulkGardenActionsView.as_view(), name='bulk-actions'),
    
    # Statistics and milestones
    path('stats/', views.CustomerStatsView.as_view(), name='customer-stats'),
    
    # Debug/testing endpoints (only available in DEBUG mode)
    path('debug/simulate-order/', views.simulate_order_completion, name='simulate-order'),
]