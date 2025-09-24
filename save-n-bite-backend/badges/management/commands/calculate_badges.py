# badges/management/commands/calculate_badges.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from badges.services import BadgeService, BadgeInitializationService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Calculate and award badges for all providers'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--provider-email',
            type=str,
            help='Calculate badges for specific provider by email',
        )
        parser.add_argument(
            '--initialize',
            action='store_true',
            help='Initialize default badge types before calculation',
        )
        parser.add_argument(
            '--leaderboards-only',
            action='store_true',
            help='Only calculate leaderboard badges',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be calculated without making changes',
        )
        parser.add_argument(
            '--debug',
            action='store_true',
            help='Show debug information about providers',
        )
    
    def handle(self, *args, **options):
        start_time = timezone.now()
        self.stdout.write(
            self.style.SUCCESS(
                f'Starting badge calculation at {start_time.strftime("%Y-%m-%d %H:%M:%S")}'
            )
        )
        
        # Initialize badge types if requested
        if options['initialize']:
            self.stdout.write('Initializing default badge types...')
            created_count = BadgeInitializationService.create_default_badge_types()
            self.stdout.write(
                self.style.SUCCESS(f'Created {created_count} new badge types')
            )
        
        badge_service = BadgeService()
        
        # Add debug information
        if options['debug'] or (not options['provider_email'] and not options['leaderboards_only']):
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Show all providers and their status
            all_providers = User.objects.filter(user_type='provider').select_related('provider_profile')
            self.stdout.write(f'Found {all_providers.count()} total providers:')
            
            verified_count = 0
            for provider in all_providers:
                if hasattr(provider, 'provider_profile') and provider.provider_profile:
                    profile = provider.provider_profile
                    status_display = f'status: {profile.status}'
                    if profile.status == 'Verified':
                        verified_count += 1
                        status_display = self.style.SUCCESS(status_display)
                    self.stdout.write(f'  - {provider.email}: {profile.business_name} ({status_display})')
                else:
                    self.stdout.write(f'  - {provider.email}: No provider profile found')
            
            self.stdout.write(f'\nVerified providers: {verified_count}')
            
            if options['debug'] and not options['provider_email']:
                # If just showing debug info, exit here
                return
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No changes will be made')
            )
            return
        
        try:
            if options['provider_email']:
                # Calculate badges for specific provider
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                try:
                    provider = User.objects.get(
                        email=options['provider_email'],
                        user_type='provider'
                    )
                    self.stdout.write(f'Calculating badges for {provider.email}...')
                    
                    badges_awarded = badge_service.calculate_provider_badges(provider)
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Awarded {len(badges_awarded)} badges to {provider.email}'
                        )
                    )
                    
                    for badge in badges_awarded:
                        self.stdout.write(f'  - {badge.badge_type.name}')
                
                except User.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(f'Provider not found: {options["provider_email"]}')
                    )
                    return
            
            elif options['leaderboards_only']:
                # Calculate only leaderboard badges
                self.stdout.write('Calculating leaderboard badges...')
                badges_awarded = badge_service.calculate_leaderboard_badges()
                
                self.stdout.write(
                    self.style.SUCCESS(f'Awarded {badges_awarded} leaderboard badges')
                )
            
            else:
                # Calculate badges for all providers
                self.stdout.write('Calculating badges for all providers...')
                results = badge_service.calculate_all_badges()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Processed {results["providers_processed"]} providers'
                    )
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Awarded {results["badges_awarded"]} total badges'
                    )
                )
                
                if results['errors']:
                    self.stdout.write(
                        self.style.WARNING(f'Encountered {len(results["errors"])} errors:')
                    )
                    for error in results['errors'][:5]:  # Show first 5 errors
                        self.stdout.write(f'  - {error}')
                    
                    if len(results['errors']) > 5:
                        self.stdout.write(f'  ... and {len(results["errors"]) - 5} more errors')
        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Badge calculation failed: {str(e)}')
            )
            logger.error(f'Badge calculation command failed: {str(e)}')
            raise
        
        end_time = timezone.now()
        duration = end_time - start_time
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Badge calculation completed in {duration.total_seconds():.2f} seconds'
            )
        )