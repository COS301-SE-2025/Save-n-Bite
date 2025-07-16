# interactions/utils.py
from django.core.exceptions import ValidationError

class StatusTransition:
    VALID_TRANSITIONS = {
        'Interaction': {
            'pending': ['confirmed', 'cancelled', 'failed'],
            'confirmed': ['completed', 'cancelled'],
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
        valid_next_statuses = cls.VALID_TRANSITIONS[model_name].get(old_status, [])
        if new_status not in valid_next_statuses:
            raise ValidationError(
                f"Invalid status transition for {model_name}: "
                f"Cannot change from {old_status} to {new_status}. "
                f"Valid transitions are: {valid_next_statuses}"
            )