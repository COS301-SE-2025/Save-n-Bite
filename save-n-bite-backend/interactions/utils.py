# interactions/utils.py
from django.core.exceptions import ValidationError

class StatusTransition:
    VALID_TRANSITIONS = {
        'Interaction': {
            'pending': ['confirmed', 'cancelled', 'failed', 'ready', 'rejected', 'completed'],
            'confirmed': ['ready', 'cancelled', 'completed'],
            'ready': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': [],
            'failed': []
        },
        'Order': {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['ready', 'completed', 'cancelled'],
            'ready': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        },
        'Payment': {
            'pending': ['completed', 'failed'],
            'completed': ['refunded'],
            'failed': [],
            'refunded': []
        }
    }

    @classmethod
    def validate_transition(cls, model_name, old_status, new_status):
        # Handle the full status name mapping
        status_mapping = {
            'ready_for_pickup': 'ready',
            'ready': 'ready'
        }
        
        # Map both old and new status
        mapped_old = status_mapping.get(old_status, old_status)
        mapped_new = status_mapping.get(new_status, new_status)
        
        valid_next_statuses = cls.VALID_TRANSITIONS[model_name].get(mapped_old, [])
        
        if mapped_new not in valid_next_statuses:
            raise ValidationError(
                f"Invalid status transition for {model_name}: "
                f"Cannot change from {old_status} to {new_status}. "
                f"Valid transitions are: {valid_next_statuses}"
            )