# admin_system/migrations/0002_add_access_log.py
# Generated migration for AccessLog model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('admin_system', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AccessLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ip_address', models.GenericIPAddressField()),
                ('endpoint', models.CharField(max_length=255)),
                ('method', models.CharField(max_length=10)),
                ('status_code', models.IntegerField()),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('user_agent', models.TextField(blank=True)),
                ('response_time', models.FloatField(blank=True, null=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='accesslog',
            index=models.Index(fields=['timestamp', 'endpoint'], name='admin_syste_timesta_b82f42_idx'),
        ),
        migrations.AddIndex(
            model_name='accesslog',
            index=models.Index(fields=['user', 'timestamp'], name='admin_syste_user_id_0f8e98_idx'),
        ),
        migrations.AddIndex(
            model_name='accesslog',
            index=models.Index(fields=['ip_address', 'timestamp'], name='admin_syste_ip_addr_e7c4d0_idx'),
        ),
        migrations.AddIndex(
            model_name='accesslog',
            index=models.Index(fields=['status_code', 'timestamp'], name='admin_syste_status__a91b55_idx'),
        ),
    ]