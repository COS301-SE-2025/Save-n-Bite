# notifications/services.py - Fixed to use UserID consistently

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Notification, EmailNotificationLog, BusinessFollower, NotificationPreferences
from authentication.models import FoodProviderProfile
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class NotificationService:
    """Service class to handle all notification operations"""

    @staticmethod
    def create_notification(
        recipient, 
        notification_type, 
        title, 
        message, 
        sender=None, 
        business=None, 
        data=None
    ):
        """Create an in-app notification"""
        notification = Notification.objects.create(
            recipient=recipient,
            sender=sender,
            business=business,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data or {}
        )
        return notification

    @staticmethod
    def send_email_notification(user, subject, template_name, context, notification=None):
        """Send email notification to user"""
        try:
            # Check if user wants email notifications
            preferences, _ = NotificationPreferences.objects.get_or_create(user=user)
            if not preferences.email_notifications:
                logger.info(f"User {user.email} has disabled email notifications")
                return False

            # Create email log entry
            email_log = EmailNotificationLog.objects.create(
                recipient_email=user.email,
                recipient_user=user,
                notification=notification,
                subject=subject,
                template_name=template_name,
                status='pending'
            )

            # Render email content
            html_message = render_to_string(f'notifications/emails/{template_name}.html', context)
            plain_message = strip_tags(html_message)

            # Send email
            success = send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False
            )

            if success:
                email_log.status = 'sent'
                email_log.sent_at = timezone.now()
                logger.info(f"Email sent successfully to {user.email}")
            else:
                email_log.status = 'failed'
                email_log.error_message = "Unknown error occurred"
                logger.error(f"Failed to send email to {user.email}")

            email_log.save()
            return success

        except Exception as e:
            logger.error(f"Error sending email to {user.email}: {str(e)}")
            if 'email_log' in locals():
                email_log.status = 'failed'
                email_log.error_message = str(e)
                email_log.save()
            return False

    @staticmethod
    def notify_followers_new_listing(business_profile, listing_data):
        """Notify all followers when a business creates a new listing"""
        followers = BusinessFollower.objects.filter(
            business=business_profile
        ).select_related('user')

        for follower in followers:
            # Check if user wants new listing notifications
            preferences, _ = NotificationPreferences.objects.get_or_create(user=follower.user)
            if not preferences.new_listing_notifications:
                continue

            # Create in-app notification
            title = f"New listing from {business_profile.business_name}"
            message = f"{business_profile.business_name} has added a new food item: {listing_data.get('name', 'Unknown item')}"
            
            notification = NotificationService.create_notification(
                recipient=follower.user,
                notification_type='new_listing',
                title=title,
                message=message,
                sender=business_profile.user,
                business=business_profile,
                data={
                    'listing_id': str(listing_data.get('id', '')),
                    'listing_name': listing_data.get('name', ''),
                    'listing_price': listing_data.get('price', ''),
                    'expiry_date': listing_data.get('expiry_date', ''),
                }
            )

            # Send email notification if enabled
            if preferences.email_notifications:
                email_context = {
                    'user_name': NotificationService._get_user_display_name(follower.user),
                    'business_name': business_profile.business_name,
                    'listing_name': listing_data.get('name', 'Unknown item'),
                    'listing_price': listing_data.get('price', 'Free'),
                    'expiry_date': listing_data.get('expiry_date', ''),
                    'listing_description': listing_data.get('description', ''),
                    'business_logo': business_profile.logo.url if business_profile.logo else None,
                }
                
                NotificationService.send_email_notification(
                    user=follower.user,
                    subject=f"New listing from {business_profile.business_name}",
                    template_name='new_listing',
                    context=email_context,
                    notification=notification
                )

        logger.info(f"Notified {followers.count()} followers about new listing from {business_profile.business_name}")

    @staticmethod
    def send_welcome_notification(user):
        """Send welcome notification to new users"""
        welcome_messages = {
            'customer': "Welcome to Save n Bite! Start browsing discounted food from local businesses and help reduce food waste.",
            'ngo': "Welcome to Save n Bite! Your organization registration is pending verification. You'll be notified once approved.",
            'provider': "Welcome to Save n Bite! Your business registration is pending verification. You'll be notified once approved."
        }

        title = "Welcome to Save n Bite!"
        message = welcome_messages.get(user.user_type, "Welcome to Save n Bite!")

        notification = NotificationService.create_notification(
            recipient=user,
            notification_type='welcome',
            title=title,
            message=message,
            data={'user_type': user.user_type}
        )

        # Send welcome email
        email_context = {
            'user_name': NotificationService._get_user_display_name(user),
            'user_type': user.user_type,
        }

        NotificationService.send_email_notification(
            user=user,
            subject="Welcome to Save n Bite!",
            template_name='welcome',
            context=email_context,
            notification=notification
        )

    @staticmethod
    def send_verification_status_notification(user, status, user_type):
        """Send notification when user verification status changes"""
        try:
            # Validate inputs
            if not user or not status or not user_type:
                logger.error(f"Invalid parameters for verification notification: user={user}, status={status}, user_type={user_type}")
                return
            
            # Ensure user has the correct profile
            if user_type == 'ngo' and not hasattr(user, 'ngo_profile'):
                logger.error(f"User {user.email} does not have an NGO profile")
                return
            elif user_type == 'provider' and not hasattr(user, 'provider_profile'):
                logger.error(f"User {user.email} does not have a provider profile")
                return

            if status == 'verified':
                title = "Account Verified!"
                if user_type == 'ngo':
                    message = "Congratulations! Your organization has been verified. You can now request food donations."
                else:
                    message = "Congratulations! Your business has been verified. You can now start listing surplus food."
            elif status == 'rejected':
                title = "Account Verification Update"
                message = "Unfortunately, your account verification was not approved. Please contact support for more information."
            else:
                logger.warning(f"Unknown verification status: {status}")
                return

            # Create in-app notification
            notification = NotificationService.create_notification(
                recipient=user,
                notification_type='business_update',
                title=title,
                message=message,
                data={'verification_status': status, 'user_type': user_type}
            )

            # Prepare email context
            email_context = {
                'user_name': NotificationService._get_user_display_name(user),
                'status': status,
                'user_type': user_type,
            }

            # Choose email template
            template_name = 'verification_approved' if status == 'verified' else 'verification_rejected'
            
            # Send email notification
            NotificationService.send_email_notification(
                user=user,
                subject=f"Save n Bite Account {status.title()}",
                template_name=template_name,
                context=email_context,
                notification=notification
            )
            
            logger.info(f"Verification notification sent successfully to {user.email} for {user_type} account: {status}")

        except Exception as e:
            logger.error(f"Failed to send verification notification to {user.email if user else 'unknown'}: {str(e)}")
            # Don't re-raise the exception to avoid breaking the verification process

    @staticmethod
    def _get_user_display_name(user):
        """Get appropriate display name for user"""
        if user.user_type == 'customer' and hasattr(user, 'customer_profile'):
            return user.customer_profile.full_name
        elif user.user_type == 'ngo' and hasattr(user, 'ngo_profile'):
            return user.ngo_profile.representative_name
        elif user.user_type == 'provider' and hasattr(user, 'provider_profile'):
            return user.provider_profile.business_name
        return user.email

    @staticmethod
    def mark_notifications_as_read(user, notification_ids):
        """Mark specified notifications as read"""
        notifications = Notification.objects.filter(
            id__in=notification_ids,
            recipient=user,
            is_read=False
        )
        
        count = notifications.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return count

    @staticmethod
    def get_unread_count(user):
        """Get count of unread notifications for user"""
        return Notification.objects.filter(
            recipient=user,
            is_read=False,
            is_deleted=False
        ).count()

    @staticmethod
    def follow_business(user, business_id):
        """Follow a business"""
        try:
            # Fix: Use UserID instead of id
            business_user = User.objects.get(UserID=business_id, user_type='provider')
            business_profile = business_user.provider_profile
            
            if business_profile.status != 'verified':
                raise ValueError("Cannot follow unverified business")
            
            follower, created = BusinessFollower.objects.get_or_create(
                user=user,
                business=business_profile,
                defaults={'user': user}
            )
            
            if created:
                # Send notification to business about new follower
                NotificationService.create_notification(
                    recipient=business_user,
                    notification_type='business_update',
                    title="New Follower",
                    message=f"{NotificationService._get_user_display_name(user)} is now following your business!",
                    sender=user,
                    business=business_profile,
                    data={
                        'follower_id': str(user.UserID),
                        'follower_name': NotificationService._get_user_display_name(user),
                        'follower_type': user.user_type,
                        'total_followers': business_profile.followers.count()
                    }
                )
                
                logger.info(f"User {user.email} started following business {business_profile.business_name}")
            
            return follower, created
            
        except User.DoesNotExist:
            raise ValueError("Business not found")
        except Exception as e:
            logger.error(f"Error following business {business_id}: {str(e)}")
            raise ValueError(f"Failed to follow business: {str(e)}")

    @staticmethod
    def unfollow_business(user, business_id):
        """Unfollow a business"""
        try:
            # Fix: Use UserID instead of id
            business_user = User.objects.get(UserID=business_id, user_type='provider')
            business_profile = business_user.provider_profile
            
            # Check if user is actually following this business
            follower_exists = BusinessFollower.objects.filter(
                user=user,
                business=business_profile
            ).exists()
            
            if not follower_exists:
                logger.warning(f"User {user.email} tried to unfollow business {business_profile.business_name} but was not following")
                return False
            
            # Delete the follower relationship
            deleted_count, _ = BusinessFollower.objects.filter(
                user=user,
                business=business_profile
            ).delete()
            
            if deleted_count > 0:
                # Optionally send notification to business about unfollowing
                try:
                    NotificationService.create_notification(
                        recipient=business_user,
                        notification_type='business_update',
                        title="Follower Update",
                        message=f"Someone unfollowed your business. Total followers: {business_profile.followers.count()}",
                        business=business_profile,
                        data={
                            'total_followers': business_profile.followers.count(),
                            'action': 'unfollow'
                        }
                    )
                except Exception as e:
                    # Don't fail the unfollow if notification fails
                    logger.error(f"Failed to send unfollow notification: {str(e)}")
                
                logger.info(f"User {user.email} unfollowed business {business_profile.business_name}")
            
            return deleted_count > 0
            
        except User.DoesNotExist:
            logger.error(f"Business with ID {business_id} not found")
            raise ValueError("Business not found")
        except Exception as e:
            logger.error(f"Error unfollowing business {business_id}: {str(e)}")
            raise ValueError(f"Failed to unfollow business: {str(e)}")

    @staticmethod
    def get_user_following(user):
        """Get list of businesses that a user is following"""
        try:
            following = BusinessFollower.objects.filter(
                user=user
            ).select_related('business', 'business__user').order_by('-created_at')
            
            following_data = []
            for follow_relationship in following:
                business_profile = follow_relationship.business
                business_user = business_profile.user
                
                # Get additional business stats
                try:
                    from food_listings.models import FoodListing
                    active_listings_count = FoodListing.objects.filter(
                        provider=business_user,
                        status='active'
                    ).count()
                except ImportError:
                    active_listings_count = 0
                
                follower_count = BusinessFollower.objects.filter(
                    business=business_profile
                ).count()
                
                business_data = {
                    'follow_id': follow_relationship.id,
                    'business_id': str(business_user.UserID),  # Fix: Use UserID
                    'business_name': business_profile.business_name,
                    'business_email': business_profile.business_email,
                    'business_address': business_profile.business_address,
                    'business_contact': business_profile.business_contact,
                    'logo': business_profile.logo.url if business_profile.logo else None,
                    'status': business_profile.status,
                    'followed_at': follow_relationship.created_at,
                    'follower_count': follower_count,
                    'active_listings_count': active_listings_count,
                }
                
                following_data.append(business_data)
            
            logger.info(f"Retrieved {len(following_data)} businesses that user {user.email} is following")
            return following_data
            
        except Exception as e:
            logger.error(f"Error getting following list for user {user.email}: {str(e)}")
            raise ValueError(f"Failed to get following list: {str(e)}")

    @staticmethod
    def get_business_followers(business_user):
        """Get list of followers for a business"""
        try:
            if not hasattr(business_user, 'provider_profile'):
                raise ValueError("User is not a business provider")
            
            business_profile = business_user.provider_profile
            
            followers = BusinessFollower.objects.filter(
                business=business_profile
            ).select_related('user').order_by('-created_at')
            
            followers_data = []
            for follower_relationship in followers:
                follower_user = follower_relationship.user
                
                # Build follower data based on user type
                follower_data = {
                    'follow_id': follower_relationship.id,
                    'user_id': str(follower_user.UserID),  # Fix: Use UserID
                    'user_type': follower_user.user_type,
                    'email': follower_user.email,
                    'followed_at': follower_relationship.created_at,
                    'name': None,
                    'profile_image': None,
                    'additional_info': {}
                }
                
                # Add user-specific data based on type
                if follower_user.user_type == 'customer' and hasattr(follower_user, 'customer_profile'):
                    customer_profile = follower_user.customer_profile
                    follower_data.update({
                        'name': customer_profile.full_name,
                        'profile_image': customer_profile.profile_image.url if customer_profile.profile_image else None,
                        'additional_info': {
                            'user_type_display': 'Customer'
                        }
                    })
                    
                elif follower_user.user_type == 'ngo' and hasattr(follower_user, 'ngo_profile'):
                    ngo_profile = follower_user.ngo_profile
                    follower_data.update({
                        'name': ngo_profile.organisation_name,
                        'profile_image': ngo_profile.organisation_logo.url if ngo_profile.organisation_logo else None,
                        'additional_info': {
                            'user_type_display': 'Organization',
                            'representative_name': ngo_profile.representative_name,
                            'representative_email': ngo_profile.representative_email,
                            'status': ngo_profile.status
                        }
                    })
                
                # If no specific profile found, use basic info
                if not follower_data['name']:
                    follower_data['name'] = follower_user.email.split('@')[0].title()
                
                followers_data.append(follower_data)
            
            # Add summary statistics
            summary = {
                'total_followers': len(followers_data),
                'customer_followers': len([f for f in followers_data if f['user_type'] == 'customer']),
                'ngo_followers': len([f for f in followers_data if f['user_type'] == 'ngo']),
                'recent_followers_30_days': len([
                    f for f in followers_data 
                    if (timezone.now() - f['followed_at']).days <= 30
                ])
            }
            
            logger.info(f"Retrieved {len(followers_data)} followers for business {business_profile.business_name}")
            
            return {
                'followers': followers_data,
                'summary': summary
            }
            
        except Exception as e:
            logger.error(f"Error getting followers for business {business_user.email}: {str(e)}")
            raise ValueError(f"Failed to get followers list: {str(e)}")

    @staticmethod
    def get_follow_status(user, business_id):
        """Check if a user is following a specific business"""
        try:
            # Fix: Use UserID instead of id
            business_user = User.objects.get(UserID=business_id, user_type='provider')
            business_profile = business_user.provider_profile
            
            is_following = BusinessFollower.objects.filter(
                user=user,
                business=business_profile
            ).exists()
            
            follower_count = BusinessFollower.objects.filter(
                business=business_profile
            ).count()
            
            return {
                'is_following': is_following,
                'follower_count': follower_count,
                'business_name': business_profile.business_name,
                'business_status': business_profile.status
            }
            
        except User.DoesNotExist:
            raise ValueError("Business not found")
        except Exception as e:
            logger.error(f"Error checking follow status: {str(e)}")
            raise ValueError(f"Failed to check follow status: {str(e)}")

    @staticmethod
    def get_follow_recommendations(user, limit=5):
        """Get recommended businesses for user to follow"""
        try:
            # Get businesses user is not already following
            already_following = BusinessFollower.objects.filter(
                user=user
            ).values_list('business__user__UserID', flat=True)  # Fix: Use UserID
            
            # Get verified businesses that user is not following
            recommended_businesses = User.objects.filter(
                user_type='provider',
                provider_profile__status='verified'
            ).exclude(
                UserID__in=already_following  # Fix: Use UserID
            ).exclude(
                UserID=user.UserID  # Fix: Use UserID - Don't recommend user's own business if they're a provider
            ).select_related('provider_profile')[:limit]
            
            recommendations = []
            for business_user in recommended_businesses:
                business_profile = business_user.provider_profile
                
                # Get business stats
                follower_count = BusinessFollower.objects.filter(
                    business=business_profile
                ).count()
                
                try:
                    from food_listings.models import FoodListing
                    active_listings_count = FoodListing.objects.filter(
                        provider=business_user,
                        status='active'
                    ).count()
                    recent_listings_count = FoodListing.objects.filter(
                        provider=business_user,
                        status='active',
                        created_at__gte=timezone.now() - timezone.timedelta(days=7)
                    ).count()
                except ImportError:
                    active_listings_count = 0
                    recent_listings_count = 0
                
                recommendation = {
                    'business_id': str(business_user.UserID),  # Fix: Use UserID
                    'business_name': business_profile.business_name,
                    'business_address': business_profile.business_address,
                    'logo': business_profile.logo.url if business_profile.logo else None,
                    'follower_count': follower_count,
                    'active_listings_count': active_listings_count,
                    'recent_listings_count': recent_listings_count,
                    'recommendation_score': follower_count + (recent_listings_count * 2)  # Simple scoring
                }
                
                recommendations.append(recommendation)
            
            # Sort by recommendation score
            recommendations.sort(key=lambda x: x['recommendation_score'], reverse=True)
            
            logger.info(f"Generated {len(recommendations)} follow recommendations for user {user.email}")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting follow recommendations: {str(e)}")
            raise ValueError(f"Failed to get recommendations: {str(e)}")

    @staticmethod
    def send_order_preparation_notification(scheduled_pickup):
        """Send notification when order is scheduled and being prepared"""
        try:
            customer = scheduled_pickup.order.interaction.user
            business = scheduled_pickup.location.business
            
            # Create in-app notification
            title = "Order Received - We're Preparing Your Order!"
            message = f"Great news! We've received your order for '{scheduled_pickup.food_listing.name}' from {business.business_name}. We're now preparing your order and will have it ready for pickup on {scheduled_pickup.scheduled_date} at {scheduled_pickup.scheduled_start_time.strftime('%H:%M')}."
            
            notification = NotificationService.create_notification(
                recipient=customer,
                notification_type='order_preparation',
                title=title,
                message=message,
                sender=business.user,
                business=business,
                data={
                    'pickup_id': str(scheduled_pickup.id),
                    'confirmation_code': scheduled_pickup.confirmation_code,
                    'food_listing_id': str(scheduled_pickup.food_listing.id),
                    'food_listing_name': scheduled_pickup.food_listing.name,
                    'business_name': business.business_name,
                    'pickup_date': scheduled_pickup.scheduled_date.isoformat(),
                    'pickup_time': scheduled_pickup.scheduled_start_time.strftime('%H:%M'),
                    'location_name': scheduled_pickup.location.name,
                    'location_address': scheduled_pickup.location.address
                }
            )

            # Check if user wants email notifications
            preferences, _ = NotificationPreferences.objects.get_or_create(user=customer)
            if preferences.email_notifications:
                # Send email notification
                email_context = {
                    'customer_name': NotificationService._get_user_display_name(customer),
                    'business_name': business.business_name,
                    'food_listing_name': scheduled_pickup.food_listing.name,
                    'confirmation_code': scheduled_pickup.confirmation_code,
                    'pickup_date': scheduled_pickup.scheduled_date.strftime('%B %d, %Y'),
                    'pickup_time': f"{scheduled_pickup.scheduled_start_time.strftime('%H:%M')} - {scheduled_pickup.scheduled_end_time.strftime('%H:%M')}",
                    'location_name': scheduled_pickup.location.name,
                    'location_address': scheduled_pickup.location.address,
                    'location_instructions': scheduled_pickup.location.instructions,
                    'contact_person': scheduled_pickup.location.contact_person,
                    'contact_phone': scheduled_pickup.location.contact_phone,
                    'customer_notes': scheduled_pickup.customer_notes,
                    'business_logo': business.logo.url if business.logo else None,
                }
                
                NotificationService.send_email_notification(
                    user=customer,
                    subject=f"Order Received - {business.business_name} is Preparing Your Order",
                    template_name='order_preparation',
                    context=email_context,
                    notification=notification
                )

            logger.info(f"Sent order preparation notification to {customer.email} for pickup {scheduled_pickup.confirmation_code}")

        except Exception as e:
            logger.error(f"Failed to send order preparation notification for pickup {scheduled_pickup.id}: {str(e)}")
            # Don't re-raise the exception to avoid breaking the scheduling process

    @staticmethod
    def send_order_completion_notification(scheduled_pickup):
        """Send thank you notification when pickup is completed"""
        try:
            customer = scheduled_pickup.order.interaction.user
            business = scheduled_pickup.location.business
            
            # Calculate total quantity from interaction items
            total_quantity = sum(item.quantity for item in scheduled_pickup.order.interaction.items.all())
            
            # Create in-app notification
            title = "Thank You for Shopping with Us!"
            message = f"Thank you for choosing {business.business_name}! Your pickup of '{scheduled_pickup.food_listing.name}' has been completed successfully. Together, we're helping reduce food waste and making a positive impact on our environment. We hope to see you again soon!"
            
            notification = NotificationService.create_notification(
                recipient=customer,
                notification_type='order_completion',
                title=title,
                message=message,
                sender=business.user,
                business=business,
                data={
                    'pickup_id': str(scheduled_pickup.id),
                    'confirmation_code': scheduled_pickup.confirmation_code,
                    'food_listing_id': str(scheduled_pickup.food_listing.id),
                    'food_listing_name': scheduled_pickup.food_listing.name,
                    'business_name': business.business_name,
                    'completed_at': scheduled_pickup.actual_pickup_time.isoformat() if scheduled_pickup.actual_pickup_time else None,
                    'total_quantity': total_quantity,
                    'sustainability_impact': 'food_waste_reduced'
                }
            )

            # Check if user wants email notifications
            preferences, _ = NotificationPreferences.objects.get_or_create(user=customer)
            if preferences.email_notifications:
                # Send email notification
                email_context = {
                    'customer_name': NotificationService._get_user_display_name(customer),
                    'business_name': business.business_name,
                    'business_address': business.business_address,
                    'business_contact': business.business_contact,
                    'food_listing_name': scheduled_pickup.food_listing.name,
                    'food_listing_description': scheduled_pickup.food_listing.description,
                    'confirmation_code': scheduled_pickup.confirmation_code,
                    'pickup_date': scheduled_pickup.scheduled_date.strftime('%B %d, %Y'),
                    'pickup_time': scheduled_pickup.actual_pickup_time.strftime('%H:%M on %B %d, %Y') if scheduled_pickup.actual_pickup_time else 'Recently',
                    'total_quantity': total_quantity,
                    'customer_notes': scheduled_pickup.customer_notes,
                    'business_notes': scheduled_pickup.business_notes,
                    'business_logo': business.logo.url if business.logo else None,
                    # Add some sustainability messaging
                    'sustainability_message': f"By purchasing surplus food, you've helped reduce food waste and supported sustainable practices in your community!",
                    'invite_back_message': f"Don't forget to follow {business.business_name} to get notified about future surplus food opportunities!"
                }
                
                NotificationService.send_email_notification(
                    user=customer,
                    subject=f"Thank You from {business.business_name} - Pickup Completed Successfully",
                    template_name='order_completion',
                    context=email_context,
                    notification=notification
                )

            logger.info(f"Sent order completion notification to {customer.email} for pickup {scheduled_pickup.confirmation_code}")

        except Exception as e:
            logger.error(f"Failed to send order completion notification for pickup {scheduled_pickup.id}: {str(e)}")
            # Don't re-raise the exception to avoid breaking the completion process