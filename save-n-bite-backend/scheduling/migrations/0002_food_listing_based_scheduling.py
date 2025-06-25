# scheduling/migrations/0002_food_listing_based_scheduling.py

from django.db import migrations, models
import django.db.models.deletion
import uuid
from datetime import timedelta


class Migration(migrations.Migration):

    dependencies = [
        ('scheduling', '0001_initial'),
        ('food_listings', '0001_initial'),
    ]

    operations = [
        # Create new FoodListingPickupSchedule model
        migrations.CreateModel(
            name='FoodListingPickupSchedule',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('pickup_window', models.CharField(max_length=50)),
                ('total_slots', models.PositiveIntegerField(default=4, help_text='Number of time slots within the pickup window')),
                ('max_orders_per_slot', models.PositiveIntegerField(default=5)),
                ('slot_buffer_minutes', models.PositiveIntegerField(default=5)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('food_listing', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='pickup_schedule', to='food_listings.foodlisting')),
                ('location', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='food_listing_schedules', to='scheduling.pickuplocation')),
            ],
        ),
        
        # Update PickupTimeSlot model to reference FoodListingPickupSchedule
        migrations.RemoveField(
            model_name='pickuptimeslot',
            name='business',
        ),
        migrations.RemoveField(
            model_name='pickuptimeslot',
            name='location',
        ),
        migrations.RemoveField(
            model_name='pickuptimeslot',
            name='day_of_week',
        ),
        migrations.RemoveField(
            model_name='pickuptimeslot',
            name='slot_duration',
        ),
        migrations.RemoveField(
            model_name='pickuptimeslot',
            name='buffer_time',
        ),
        migrations.RemoveField(
            model_name='pickuptimeslot',
            name='advance_booking_hours',
        ),
        
        migrations.AddField(
            model_name='pickuptimeslot',
            name='pickup_schedule',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='time_slots', to='scheduling.foodlistingpickupschedule', null=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='pickuptimeslot',
            name='slot_number',
            field=models.PositiveIntegerField(default=1),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='pickuptimeslot',
            name='date',
            field=models.DateField(null=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='pickuptimeslot',
            name='current_bookings',
            field=models.PositiveIntegerField(default=0),
        ),
        
        # Update ScheduledPickup model to reference food listing
        migrations.AddField(
            model_name='scheduledpickup',
            name='food_listing',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='scheduled_pickups', to='food_listings.foodlisting', null=True),
            preserve_default=False,
        ),
        
        # Remove the old time_slot field and add the new one
        migrations.RemoveField(
            model_name='scheduledpickup',
            name='time_slot',
        ),
        migrations.AddField(
            model_name='scheduledpickup',
            name='time_slot',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='scheduled_pickups', to='scheduling.pickuptimeslot', null=True),
            preserve_default=False,
        ),
        
        # Update unique constraints
        migrations.AlterUniqueTogether(
            name='pickuptimeslot',
            unique_together={('pickup_schedule', 'date', 'slot_number')},
        ),
        
        # Remove old unique constraint from PickupTimeSlot
        migrations.RemoveField(
            model_name='pickuptimeslot',
            name='business',
        ),
        
        # Make pickup_schedule and date non-nullable after data migration
        migrations.AlterField(
            model_name='pickuptimeslot',
            name='pickup_schedule',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='time_slots', to='scheduling.foodlistingpickupschedule'),
        ),
        migrations.AlterField(
            model_name='pickuptimeslot',
            name='date',
            field=models.DateField(),
        ),
        migrations.AlterField(
            model_name='scheduledpickup',
            name='food_listing',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='scheduled_pickups', to='food_listings.foodlisting'),
        ),
        migrations.AlterField(
            model_name='scheduledpickup',
            name='time_slot',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='scheduled_pickups', to='scheduling.pickuptimeslot'),
        ),
    ]