# reviews/migrations/0001_initial.py

from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
import uuid
from django.conf import settings


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('authentication', '0001_initial'),
        ('interactions', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Review',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action', models.CharField(choices=[('flag', 'Flagged'), ('censor', 'Censored'), ('delete', 'Deleted'), ('restore', 'Restored'), ('note_added', 'Note Added')], max_length=20)),
                ('reason', models.TextField(help_text='Reason for the moderation action')),
                ('previous_status', models.CharField(max_length=10)),
                ('new_status', models.CharField(max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('moderator', models.ForeignKey(limit_choices_to={'admin_rights': True}, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('review', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='moderation_logs', to='reviews.review')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='BusinessReviewStats',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_reviews', models.PositiveIntegerField(default=0)),
                ('average_rating', models.DecimalField(decimal_places=2, default=0.0, help_text='Average rating (0.00-5.00)', max_digits=3)),
                ('rating_1_count', models.PositiveIntegerField(default=0)),
                ('rating_2_count', models.PositiveIntegerField(default=0)),
                ('rating_3_count', models.PositiveIntegerField(default=0)),
                ('rating_4_count', models.PositiveIntegerField(default=0)),
                ('rating_5_count', models.PositiveIntegerField(default=0)),
                ('highest_rating', models.PositiveIntegerField(default=0)),
                ('lowest_rating', models.PositiveIntegerField(default=0)),
                ('reviews_this_month', models.PositiveIntegerField(default=0)),
                ('reviews_this_week', models.PositiveIntegerField(default=0)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('business', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='review_stats', to='authentication.foodproviderprofile')),
            ],
            options={
                'verbose_name': 'Business Review Statistics',
                'verbose_name_plural': 'Business Review Statistics',
            },
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['business', '-created_at'], name='reviews_rev_busines_e7c4a3_idx'),
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['reviewer', '-created_at'], name='reviews_rev_reviewe_f8b0f8_idx'),
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['status'], name='reviews_rev_status_c8e8e5_idx'),
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['general_rating'], name='reviews_rev_general_b7f2a4_idx'),
        ),
    ]