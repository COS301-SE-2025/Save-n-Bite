from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from notifications.models import Notification
from authentication.models import FoodProviderProfile

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates dummy notifications for testing'

    def handle(self, *args, **kwargs):
        # Get test users
        users = User.objects.filter(username__in=['testcustomer', 'testngo', 'testprovider'])
        if not users.exists():
            self.stdout.write(self.style.ERROR('Test users not found. Run create_mock_data first.'))
            return

        for user in users:
            Notification.objects.create(
                recipient=user,
                notification_type='welcome',
                title=f'Welcome, {user.username}!',
                message=f'This is a dummy notification for {user.username}.',
                data={"info": "This is a test notification."}
            )
            Notification.objects.create(
                recipient=user,
                notification_type='system_announcement',
                title='System Update',
                message='A new feature has been added to the platform!',
                data={"feature": "Dummy notifications"}
            )
        self.stdout.write(self.style.SUCCESS('Dummy notifications created for test users.')) 