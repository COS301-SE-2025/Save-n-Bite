# badges/admin.py

from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count, F
from .models import BadgeType, ProviderBadge, BadgeLeaderboard, ProviderBadgeStats


@admin.register(BadgeType)
class BadgeTypeAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'rarity', 'is_active', 
        'total_earned', 'display_order', 'created_at'
    ]
    list_filter = ['category', 'rarity', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'criteria_description']
    ordering = ['category', 'display_order', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'category', 'rarity', 'svg_filename')
        }),
        ('Criteria', {
            'fields': ('criteria_description',)
        }),
        ('Display Settings', {
            'fields': ('display_order', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def total_earned(self, obj):
        """Show total number of times this badge has been earned"""
        count = ProviderBadge.objects.filter(badge_type=obj).count()
        return count
    total_earned.short_description = 'Times Earned'
    
    def get_queryset(self, request):
        """Add annotation for earned count"""
        queryset = super().get_queryset(request)
        return queryset.annotate(
            earned_count=Count('earned_by')
        )
    
    actions = ['activate_badges', 'deactivate_badges']
    
    def activate_badges(self, request, queryset):
        """Activate selected badges"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} badges activated.')
    activate_badges.short_description = 'Activate selected badges'
    
    def deactivate_badges(self, request, queryset):
        """Deactivate selected badges"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} badges deactivated.')
    deactivate_badges.short_description = 'Deactivate selected badges'


@admin.register(ProviderBadge)
class ProviderBadgeAdmin(admin.ModelAdmin):
    list_display = [
        'provider_name', 'badge_name', 'category', 'rarity',
        'earned_date', 'is_pinned', 'month_year_display'
    ]
    list_filter = [
        'badge_type__category', 'badge_type__rarity', 'is_pinned',
        'earned_date', 'month', 'year'
    ]
    search_fields = [
        'provider__provider_profile__business_name',
        'provider__email',
        'badge_type__name',
        'earned_reason'
    ]
    ordering = ['-earned_date']
    
    fieldsets = (
        ('Badge Assignment', {
            'fields': ('provider', 'badge_type', 'earned_date', 'earned_reason')
        }),
        ('Badge Data', {
            'fields': ('badge_data',),
            'classes': ('collapse',)
        }),
        ('Display Settings', {
            'fields': ('is_pinned', 'pin_order')
        }),
        ('Monthly Badge Info', {
            'fields': ('month', 'year'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['earned_date']
    
    def provider_name(self, obj):
        """Display provider business name"""
        if hasattr(obj.provider, 'provider_profile'):
            return obj.provider.provider_profile.business_name
        return obj.provider.email
    provider_name.short_description = 'Provider'
    provider_name.admin_order_field = 'provider__provider_profile__business_name'
    
    def badge_name(self, obj):
        """Display badge name with link to badge type"""
        url = reverse('admin:badges_badgetype_change', args=[obj.badge_type.pk])
        return format_html('<a href="{}">{}</a>', url, obj.badge_type.name)
    badge_name.short_description = 'Badge'
    badge_name.admin_order_field = 'badge_type__name'
    
    def category(self, obj):
        """Display badge category"""
        return obj.badge_type.get_category_display()
    category.short_description = 'Category'
    category.admin_order_field = 'badge_type__category'
    
    def rarity(self, obj):
        """Display badge rarity with color coding"""
        rarity = obj.badge_type.rarity
        colors = {
            'common': '#6B7280',
            'uncommon': '#10B981',
            'rare': '#3B82F6',
            'epic': '#8B5CF6',
            'legendary': '#F59E0B'
        }
        color = colors.get(rarity, '#6B7280')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.badge_type.get_rarity_display()
        )
    rarity.short_description = 'Rarity'
    rarity.admin_order_field = 'badge_type__rarity'
    
    def month_year_display(self, obj):
        """Display month/year for monthly badges"""
        if obj.month and obj.year:
            return f"{obj.year}-{obj.month:02d}"
        return "-"
    month_year_display.short_description = 'Month/Year'
    
    actions = ['pin_badges', 'unpin_badges']
    
    def pin_badges(self, request, queryset):
        """Pin selected badges"""
        updated = 0
        for badge in queryset:
            if not badge.is_pinned:
                pinned_count = ProviderBadge.objects.filter(
                    provider=badge.provider, is_pinned=True
                ).count()
                if pinned_count < 5:
                    badge.is_pinned = True
                    badge.pin_order = pinned_count + 1
                    badge.save()
                    updated += 1
        
        self.message_user(request, f'{updated} badges pinned.')
    pin_badges.short_description = 'Pin selected badges'
    
    def unpin_badges(self, request, queryset):
        """Unpin selected badges"""
        updated = queryset.filter(is_pinned=True).update(is_pinned=False, pin_order=0)
        self.message_user(request, f'{updated} badges unpinned.')
    unpin_badges.short_description = 'Unpin selected badges'


@admin.register(BadgeLeaderboard)
class BadgeLeaderboardAdmin(admin.ModelAdmin):
    list_display = [
        'leaderboard_type_display', 'month_year', 'first_place_name',
        'second_place_name', 'third_place_name', 'is_finalized', 'calculated_at'
    ]
    list_filter = ['leaderboard_type', 'year', 'month', 'is_finalized', 'calculated_at']
    ordering = ['-year', '-month', 'leaderboard_type']
    
    fieldsets = (
        ('Leaderboard Info', {
            'fields': ('leaderboard_type', 'month', 'year')
        }),
        ('Rankings', {
            'fields': (
                ('first_place', 'first_place_value'),
                ('second_place', 'second_place_value'),
                ('third_place', 'third_place_value')
            )
        }),
        ('Status', {
            'fields': ('is_finalized', 'calculated_at')
        })
    )
    
    readonly_fields = ['calculated_at']
    
    def leaderboard_type_display(self, obj):
        """Display leaderboard type"""
        return obj.get_leaderboard_type_display()
    leaderboard_type_display.short_description = 'Type'
    leaderboard_type_display.admin_order_field = 'leaderboard_type'
    
    def month_year(self, obj):
        """Display month/year"""
        return f"{obj.year}-{obj.month:02d}"
    month_year.short_description = 'Month/Year'
    month_year.admin_order_field = 'year'
    
    def first_place_name(self, obj):
        """Display first place provider name"""
        if obj.first_place and hasattr(obj.first_place, 'provider_profile'):
            return obj.first_place.provider_profile.business_name
        return "-"
    first_place_name.short_description = '1st Place'
    
    def second_place_name(self, obj):
        """Display second place provider name"""
        if obj.second_place and hasattr(obj.second_place, 'provider_profile'):
            return obj.second_place.provider_profile.business_name
        return "-"
    second_place_name.short_description = '2nd Place'
    
    def third_place_name(self, obj):
        """Display third place provider name"""
        if obj.third_place and hasattr(obj.third_place, 'provider_profile'):
            return obj.third_place.provider_profile.business_name
        return "-"
    third_place_name.short_description = '3rd Place'


@admin.register(ProviderBadgeStats)
class ProviderBadgeStatsAdmin(admin.ModelAdmin):
    list_display = [
        'provider_name', 'total_badges', 'rarity_score_display',
        'pinned_badges_count', 'latest_badge_earned', 'last_calculated_at'
    ]
    list_filter = ['last_calculated_at']
    search_fields = [
        'provider__provider_profile__business_name',
        'provider__email'
    ]
    ordering = ['-total_badges', '-last_calculated_at']
    
    fieldsets = (
        ('Provider', {
            'fields': ('provider',)
        }),
        ('Badge Counts by Category', {
            'fields': (
                'total_badges',
                ('performance_badges', 'milestone_badges'),
                ('recognition_badges', 'monthly_badges', 'special_badges')
            )
        }),
        ('Badge Counts by Rarity', {
            'fields': (
                ('common_badges', 'uncommon_badges'),
                ('rare_badges', 'epic_badges', 'legendary_badges')
            )
        }),
        ('Badge Timeline', {
            'fields': (
                'first_badge_earned', 'latest_badge_earned',
                'pinned_badges_count'
            )
        }),
        ('System', {
            'fields': ('last_calculated_at',),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['last_calculated_at']
    
    def provider_name(self, obj):
        """Display provider business name"""
        if hasattr(obj.provider, 'provider_profile'):
            return obj.provider.provider_profile.business_name
        return obj.provider.email
    provider_name.short_description = 'Provider'
    provider_name.admin_order_field = 'provider__provider_profile__business_name'
    
    def rarity_score_display(self, obj):
        """Display calculated rarity score"""
        return obj.get_rarity_score()
    rarity_score_display.short_description = 'Rarity Score'
    
    actions = ['recalculate_stats']
    
    def recalculate_stats(self, request, queryset):
        """Recalculate stats for selected providers"""
        from .services import BadgeService
        badge_service = BadgeService()
        
        updated_count = 0
        for stats in queryset:
            badge_service.update_provider_badge_stats(stats.provider)
            updated_count += 1
        
        self.message_user(
            request,
            f'Successfully recalculated badge statistics for {updated_count} providers.'
        )
    recalculate_stats.short_description = 'Recalculate selected statistics'


# Configure admin site header and title
admin.site.site_header = "Save n Bite Badges Admin"
admin.site.site_title = "Badges Admin"
admin.site.index_title = "Manage Provider Badges"