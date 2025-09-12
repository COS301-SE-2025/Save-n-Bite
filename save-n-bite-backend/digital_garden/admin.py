# digital_garden/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
import json

from .models import (
    Plant, CustomerGarden, GardenTile, PlantInventory,
    PlantReward, CustomerStats
)


@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    """Admin interface for Plant model"""
    list_display = [
        'name', 'rarity', 'category', 'native_region', 
        'care_difficulty', 'is_active', 'created_at'
    ]
    list_filter = ['rarity', 'category', 'care_difficulty', 'is_active', 'native_region']
    search_fields = ['name', 'scientific_name', 'common_names']
    ordering = ['rarity', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'scientific_name', 'common_names', 'category', 'rarity')
        }),
        ('Care Requirements', {
            'fields': ('care_difficulty', 'sunlight_requirements', 'water_requirements', 'native_region')
        }),
        ('Content', {
            'fields': ('description', 'fun_facts', 'growing_tips')
        }),
        ('Visual & Technical', {
            'fields': ('rive_asset_name', 'icon_color')
        }),
        ('Status', {
            'fields': ('is_active',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


class GardenTileInline(admin.TabularInline):
    """Inline admin for garden tiles"""
    model = GardenTile
    extra = 0
    readonly_fields = ['planted_at', 'custom_data_display']
    fields = ['row', 'col', 'plant', 'planted_at', 'custom_data_display']
    
    def custom_data_display(self, obj):
        if obj.custom_data:
            return format_html('<pre>{}</pre>', json.dumps(obj.custom_data, indent=2))
        return '-'
    custom_data_display.short_description = 'Custom Data'


@admin.register(CustomerGarden)
class CustomerGardenAdmin(admin.ModelAdmin):
    """Admin interface for CustomerGarden model"""
    list_display = [
        'customer_link', 'name', 'total_plants_earned', 
        'total_plants_placed', 'garden_level', 'completion_percentage',
        'created_at'
    ]
    list_filter = ['garden_level', 'created_at']
    search_fields = ['customer__username', 'customer__email', 'name']
    readonly_fields = ['completion_percentage', 'rarity_distribution']
    
    fieldsets = (
        ('Garden Information', {
            'fields': ('customer', 'name', 'garden_level')
        }),
        ('Statistics', {
            'fields': ('total_plants_earned', 'total_plants_placed', 'completion_percentage', 'rarity_distribution')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    inlines = [GardenTileInline]
    
    def customer_link(self, obj):
        url = reverse('admin:authentication_user_change', args=[obj.customer.pk])
        return format_html('<a href="{}">{}</a>', url, obj.customer.username)
    customer_link.short_description = 'Customer'
    customer_link.admin_order_field = 'customer__username'
    
    def completion_percentage(self, obj):
        percentage = obj.get_completion_percentage()
        return f"{percentage:.1f}%"
    completion_percentage.short_description = 'Completion'
    
    def rarity_distribution(self, obj):
        distribution = obj.get_rarity_distribution()
        if distribution:
            items = [f"{item['plant__rarity']}: {item['count']}" for item in distribution]
            return ", ".join(items)
        return "No plants placed"


@admin.register(GardenTile)
class GardenTileAdmin(admin.ModelAdmin):
    """Admin interface for GardenTile model"""
    list_display = ['garden_customer', 'position', 'plant', 'planted_at']
    list_filter = ['plant__rarity', 'planted_at']
    search_fields = ['garden__customer__username', 'plant__name']
    readonly_fields = ['planted_at']
    
    def garden_customer(self, obj):
        return obj.garden.customer.username
    garden_customer.short_description = 'Customer'
    garden_customer.admin_order_field = 'garden__customer__username'
    
    def position(self, obj):
        return f"[{obj.row}, {obj.col}]"


@admin.register(PlantInventory)
class PlantInventoryAdmin(admin.ModelAdmin):
    """Admin interface for PlantInventory model"""
    list_display = [
        'customer_link', 'plant', 'quantity', 'earned_reason', 
        'earned_from_order_link', 'earned_at'
    ]
    list_filter = ['earned_reason', 'earned_at', 'plant__rarity']
    search_fields = ['customer__username', 'plant__name']
    date_hierarchy = 'earned_at'
    
    def customer_link(self, obj):
        url = reverse('admin:authentication_user_change', args=[obj.customer.pk])
        return format_html('<a href="{}">{}</a>', url, obj.customer.username)
    customer_link.short_description = 'Customer'
    customer_link.admin_order_field = 'customer__username'
    
    def earned_from_order_link(self, obj):
        if obj.earned_from_order:
            url = reverse('admin:interactions_order_change', args=[obj.earned_from_order.pk])
            return format_html('<a href="{}">{}</a>', url, str(obj.earned_from_order.id)[:8])
        return '-'
    earned_from_order_link.short_description = 'Order'


@admin.register(PlantReward)
class PlantRewardAdmin(admin.ModelAdmin):
    """Admin interface for PlantReward model"""
    list_display = [
        'milestone_display', 'plant', 'quantity', 'is_active', 'created_at'
    ]
    list_filter = ['milestone_type', 'is_active', 'plant__rarity']
    search_fields = ['plant__name']
    ordering = ['milestone_type', 'milestone_value']
    
    def milestone_display(self, obj):
        return f"{obj.get_milestone_type_display()}: {obj.milestone_value}"
    milestone_display.short_description = 'Milestone'
    milestone_display.admin_order_field = 'milestone_type'


@admin.register(CustomerStats)
class CustomerStatsAdmin(admin.ModelAdmin):
    """Admin interface for CustomerStats model"""
    list_display = [
        'customer_link', 'total_orders', 'total_order_amount', 
        'unique_businesses_ordered_from', 'achieved_milestones_count',
        'last_calculated_at'
    ]
    search_fields = ['customer__username', 'customer__email']
    readonly_fields = ['last_calculated_at', 'achieved_milestones_display']
    date_hierarchy = 'last_calculated_at'
    
    fieldsets = (
        ('Customer', {
            'fields': ('customer',)
        }),
        ('Order Statistics', {
            'fields': ('total_orders', 'total_order_amount', 'unique_businesses_ordered_from')
        }),
        ('Milestones', {
            'fields': ('achieved_milestones_display',),
            'classes': ('collapse',)
        }),
        ('System', {
            'fields': ('last_calculated_at',),
            'classes': ('collapse',)
        })
    )
    
    actions = ['recalculate_stats']
    
    def customer_link(self, obj):
        url = reverse('admin:authentication_user_change', args=[obj.customer.pk])
        return format_html('<a href="{}">{}</a>', url, obj.customer.username)
    customer_link.short_description = 'Customer'
    customer_link.admin_order_field = 'customer__username'
    
    def achieved_milestones_count(self, obj):
        total = sum(len(milestones) for milestones in obj.achieved_milestones.values())
        return total
    achieved_milestones_count.short_description = 'Milestones Achieved'
    
    def achieved_milestones_display(self, obj):
        if obj.achieved_milestones:
            formatted = []
            for milestone_type, values in obj.achieved_milestones.items():
                formatted.append(f"<strong>{milestone_type}:</strong> {', '.join(map(str, values))}")
            return format_html('<br>'.join(formatted))
        return 'No milestones achieved'
    achieved_milestones_display.short_description = 'Achieved Milestones'
    
    def recalculate_stats(self, request, queryset):
        """Admin action to recalculate statistics"""
        from .services import DigitalGardenService
        service = DigitalGardenService()
        
        updated_count = 0
        for stats in queryset:
            service.update_customer_stats(stats.customer)
            updated_count += 1
        
        self.message_user(
            request,
            f'Successfully recalculated statistics for {updated_count} customers.'
        )
    recalculate_stats.short_description = 'Recalculate selected statistics'


# Custom admin site configurations
admin.site.site_header = "Save n Bite Digital Garden Admin"
admin.site.site_title = "Digital Garden Admin"
admin.site.index_title = "Manage Digital Gardens"