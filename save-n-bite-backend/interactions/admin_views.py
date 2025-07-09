from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Q
from admin_panel.permissions import IsSystemAdmin
from admin_panel.services import AdminService
from .models import Interaction
from .serializers import InteractionSerializer

@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def admin_get_all_transactions(request):
    """Get all transactions for admin management"""
    try:
        # Get query parameters
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        transaction_type = request.GET.get('type', '')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        # Build query
        queryset = Interaction.objects.select_related('user', 'business').all()
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(user__email__icontains=search) |
                Q(business__business_name__icontains=search)
            )
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        if transaction_type:
            queryset = queryset.filter(interaction_type=transaction_type)
        
        # Order by creation date
        queryset = queryset.order_by('-created_at')
        
        # Paginate
        paginator = Paginator(queryset, per_page)
        page_obj = paginator.get_page(page)
        
        # Serialize
        serializer = InteractionSerializer(page_obj.object_list, many=True)
        
        return Response({
            'transactions': serializer.data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': {
                'code': 'TRANSACTIONS_FETCH_ERROR',
                'message': 'Failed to fetch transactions'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsSystemAdmin])
def admin_update_transaction_status(request):
    """Update transaction status (for dispute resolution, etc.)"""
    transaction_id = request.data.get('transaction_id')
    new_status = request.data.get('new_status')
    reason = request.data.get('reason', '')
    
    if not transaction_id or not new_status:
        return Response({
            'error': {
                'code': 'MISSING_FIELDS',
                'message': 'transaction_id and new_status are required'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        transaction = Interaction.objects.get(id=transaction_id)
        old_status = transaction.status
        
        # Update status
        transaction.status = new_status
        transaction.save()
        
        # Log the action
        AdminService.log_admin_action(
            admin_user=request.user,
            action_type='transaction_management',
            target_type='interaction',
            target_id=transaction_id,
            description=f"Updated transaction status from {old_status} to {new_status}",
            metadata={
                'old_status': old_status,
                'new_status': new_status,
                'reason': reason,
                'transaction_type': transaction.interaction_type,
                'amount': float(transaction.total_amount)
            },
            ip_address=get_client_ip(request)
        )
        
        return Response({
            'message': 'Transaction status updated successfully',
            'transaction': {
                'id': str(transaction.id),
                'old_status': old_status,
                'new_status': new_status,
                'reason': reason
            }
        }, status=status.HTTP_200_OK)
        
    except Interaction.DoesNotExist:
        return Response({
            'error': {
                'code': 'TRANSACTION_NOT_FOUND',
                'message': 'Transaction not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': {
                'code': 'TRANSACTION_UPDATE_ERROR',
                'message': 'Failed to update transaction status'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)