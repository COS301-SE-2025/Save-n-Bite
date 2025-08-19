# interactions/admin_views.py - Create this new file

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Q
import logging

from .models import Interaction, Order, Payment, InteractionItem
from admin_system.permissions import IsSystemAdmin

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def admin_get_all_transactions(request):
    """Get all transactions/interactions for admin viewing"""
    try:
        search = request.GET.get('search', '')
        type_filter = request.GET.get('type', '')
        status_filter = request.GET.get('status', '')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        queryset = Interaction.objects.select_related(
            'user', 'business__user'
        ).prefetch_related('items', 'order', 'payment').all()
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(business__business_name__icontains=search) |
                Q(business__user__username__icontains=search)
            )
        
        if type_filter and type_filter != 'All':
            # Map frontend types to backend
            if type_filter == 'Sale':
                queryset = queryset.filter(interaction_type='Purchase')
            elif type_filter == 'Donation':
                queryset = queryset.filter(interaction_type='Donation')
                
        if status_filter and status_filter != 'All':
            queryset = queryset.filter(status=status_filter.lower())
        
        # Order by creation date
        queryset = queryset.order_by('-created_at')
        
        # Paginate
        paginator = Paginator(queryset, per_page)
        page_obj = paginator.get_page(page)
        
        transactions_data = []
        for interaction in page_obj.object_list:
            # Get order and payment info if they exist
            order = getattr(interaction, 'order', None)
            payment = getattr(interaction, 'payment', None)
            
            # Get business name
            business_name = (
                interaction.business.business_name 
                if interaction.business 
                else "Unknown Business"
            )
            
            transactions_data.append({
                'id': str(interaction.id),
                'provider': {
                    'name': business_name,
                    'id': str(interaction.business.user.UserID) if interaction.business else None
                },
                'consumer': {
                    'name': interaction.user.username,
                    'id': str(interaction.user.UserID)
                },
                'type': 'Sale' if interaction.interaction_type == 'Purchase' else 'Donation',
                'amount': f"R{interaction.total_amount}" if interaction.total_amount > 0 else "Free",
                'status': interaction.status.title(),
                'date': interaction.created_at.isoformat(),
                'items_count': interaction.items.count() if hasattr(interaction, 'items') else 0,
                'pickup_code': order.pickup_code if order else None,
                'payment_status': payment.status if payment else None,
                'special_instructions': interaction.special_instructions or ''
            })
        
        return Response({
            'transactions': transactions_data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get admin transactions error: {str(e)}")
        return Response({
            'error': {
                'code': 'TRANSACTIONS_FETCH_ERROR',
                'message': 'Failed to fetch transactions'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)