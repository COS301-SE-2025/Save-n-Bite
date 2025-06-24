# reviews/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Review, ReviewModerationLog, BusinessReviewStats

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'reviewer_email', 'business_name', 'general_rating', 
        'status', 'review_source', 'created_at', 'moderated_by'
    ]
    list_filter = [
        'status', 'review_source', 'general_rating', 'created_at', 
        'interaction_type'
    ]
    search_fields = [
        'reviewer__email', 'business__business_name', 
        'general_comment', 'food_review', 'business_review'
    ]
    readonly_fields = [
        'id', 'interaction', 'reviewer', 'business', 'interaction_type',
        'interaction_total_amount', 'food_items_snapshot', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'interaction', 'reviewer', 'business', 'review_source')
        }),
        ('Review Content', {
            'fields': ('general_rating', 'general_comment', 'food_review', 'business_review')
        }),
        ('Interaction Context', {
            'fields': ('interaction_type', 'interaction_total_amount', 'food_items_display'),
            'classes': ('collapse',)
        }),
        ('Moderation', {
            'fields': ('status', 'moderation_notes', 'moderated_by', 'moderated_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def reviewer_email(self, obj):
        return obj.reviewer.email
    reviewer_email.short_description = 'Reviewer'
    
    def business_name(self, obj):
        return obj.business.business_name
    business_name.short_description = 'Business'
    
    def food_items_display(self, obj):
        """Display food items in a readable format"""
        if not obj.food_items_snapshot:
            return "No items"
        
        items_html = "<ul>"
        for item in obj.food_items_snapshot:
            items_html += f"<li>{item.get('name', 'Unknown')} (Qty: {item.get('quantity', 0)})</li>"
        items_html += "</ul>"
        return mark_safe(items_html)
    food_items_display.short_description = 'Food Items'
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('reviewer', 'business', 'moderated_by')
    
    actions = ['mark_as_flagged', 'mark_as_active', 'mark_as_deleted']
    
    def mark_as_flagged(self, request, queryset):
        updated = queryset.update(status='flagged', moderated_by=request.user)
        self.message_user(request, f'{updated} reviews marked as flagged.')
    mark_as_flagged.short_description = "Mark selected reviews as flagged"
    
    def mark_as_active(self, request, queryset):
        updated = queryset.update(status='active', moderated_by=request.user)
        self.message_user(request, f'{updated} reviews marked as active.')
    mark_as_active.short_description = "Mark selected reviews as active"
    
    def mark_as_deleted(self, request, queryset):
        updated = queryset.update(status='deleted', moderated_by=request.user)
        self.message_user(request, f'{updated} reviews marked as deleted.')
    mark_as_deleted.short_description = "Mark selected reviews as deleted"


@admin.register(ReviewModerationLog)
class ReviewModerationLogAdmin(admin.ModelAdmin):
    list_display = [
        'review_id', 'action', 'moderator_email', 'previous_status', 
        'new_status', 'created_at'
    ]
    list_filter = ['action', 'previous_status', 'new_status', 'created_at']
    search_fields = ['review__id', 'moderator__email', 'reason']
    readonly_fields = ['id', 'review', 'moderator', 'created_at']
    
    fieldsets = (
        ('Moderation Action', {
            'fields': ('review', 'moderator', 'action')
        }),
        ('Status Change', {
            'fields': ('previous_status', 'new_status', 'reason')
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
    
    def review_id(self, obj):
        return str(obj.review.id)[:8] + '...'
    review_id.short_description = 'Review ID'
    
    def moderator_email(self, obj):
        return obj.moderator.email
    moderator_email.short_description = 'Moderator'
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('review', 'moderator')


@admin.register(BusinessReviewStats)
class BusinessReviewStatsAdmin(admin.ModelAdmin):
    list_display = [
        'business_name', 'total_reviews', 'average_rating',
        'highest_rating', 'lowest_rating', 'last_updated'
    ]
    list_filter = ['last_updated']
    search_fields = ['business__business_name']
    readonly_fields = [
        'business', 'total_reviews', 'average_rating', 'rating_1_count',
        'rating_2_count', 'rating_3_count', 'rating_4_count', 'rating_5_count',
        'highest_rating', 'lowest_rating', 'reviews_this_month',
        'reviews_this_week', 'last_updated'
    ]
    
    fieldsets = (
        ('Business', {
            'fields': ('business',)
        }),
        ('Overall Statistics', {
            'fields': ('total_reviews', 'average_rating', 'highest_rating', 'lowest_rating')
        }),
        ('Rating Distribution', {
            'fields': ('rating_1_count', 'rating_2_count', 'rating_3_count', 
                      'rating_4_count', 'rating_5_count')
        }),
        ('Recent Activity', {
            'fields': ('reviews_this_month', 'reviews_this_week')
        }),
        ('Last Updated', {
            'fields': ('last_updated',)
        }),
    )
    
    def business_name(self, obj):
        return obj.business.business_name
    business_name.short_description = 'Business Name'
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('business')
    
    actions = ['recalculate_stats']
    
    def recalculate_stats(self, request, queryset):
        count = 0
        for stats in queryset:
            stats.recalculate_stats()
            count += 1
        self.message_user(request, f'Recalculated statistics for {count} businesses.')
    recalculate_stats.short_description = "Recalculate statistics for selected businesses"