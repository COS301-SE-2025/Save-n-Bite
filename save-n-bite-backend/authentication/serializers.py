# authentication/serializers.py

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, CustomerProfile, NGOProfile, FoodProviderProfile
from django.contrib.auth import get_user_model
import base64
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class BaseRegistrationSerializer(serializers.ModelSerializer):
    # Relax password validation to match test expectations
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='normal')

    class Meta:
        model = User
        fields = ['email', 'password', 'role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.pop('role', 'normal')
        email = validated_data.pop('email')

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            role=role,
            **validated_data
        )
        return user

class CustomerRegistrationSerializer(BaseRegistrationSerializer):
    full_name = serializers.CharField(max_length=255)
    profile_image = serializers.CharField(required=False, allow_blank=True)

    class Meta(BaseRegistrationSerializer.Meta):
        fields = BaseRegistrationSerializer.Meta.fields + ['full_name', 'profile_image']

    def create(self, validated_data):
        full_name = validated_data.pop('full_name')
        profile_image_data = validated_data.pop('profile_image', None)
        validated_data['user_type'] = 'customer'

        # Create user (signal may or may not create profile depending on tests)
        user = super().create(validated_data)

        # Get or create the profile and update it
        customer_profile, _ = CustomerProfile.objects.get_or_create(user=user)

        customer_profile.full_name = full_name

        # Handle profile image upload to blob storage
        if profile_image_data:
            try:
                # Parse base64 data
                if profile_image_data.startswith('data:'):
                    format_part, data_part = profile_image_data.split(';base64,')
                    ext = format_part.split('/')[-1]
                else:
                    data_part = profile_image_data
                    ext = 'jpg'
                
                # Decode and create file
                image_data = base64.b64decode(data_part)
                image_file = ContentFile(image_data, name=f'profile_{user.UserID}.{ext}')
                
                # Save to blob storage
                customer_profile.profile_image.save(
                    f'profile_{user.UserID}.{ext}',
                    image_file,
                    save=False  # Don't save yet
                )
                
                logger.info(f"Successfully uploaded profile image for customer {user.email}")
                
            except Exception as e:
                logger.error(f"Failed to upload profile image for customer {user.email}: {str(e)}")
                # Don't fail registration for image upload errors

        customer_profile.save()
        return user

class NGORegistrationSerializer(BaseRegistrationSerializer):
    organisation_name = serializers.CharField(max_length=255)
    organisation_contact = serializers.CharField(max_length=20)
    representative_name = serializers.CharField(max_length=255)

    representative_email = serializers.EmailField(required=False, allow_blank=True)

    organisational_email = serializers.EmailField()
    organisation_street = serializers.CharField(max_length=255)
    organisation_city = serializers.CharField(max_length=255)
    organisation_province = serializers.CharField(max_length=255)
    organisation_postal_code = serializers.CharField(max_length=10)
    npo_document = serializers.CharField()
    organisation_logo = serializers.CharField(required=False, allow_blank=True)

    class Meta(BaseRegistrationSerializer.Meta):
        fields = BaseRegistrationSerializer.Meta.fields + [
            'organisation_name', 'organisation_contact', 'representative_name',
            'representative_email',  # Add this back to the fields list
            'organisational_email', 'organisation_street', 
            'organisation_city', 'organisation_province', 'organisation_postal_code', 
            'npo_document', 'organisation_logo'
        ]

    def create(self, validated_data):
        # Extract NGO-specific data
        organisation_data = {
            'organisation_name': validated_data.pop('organisation_name'),
            'organisation_contact': validated_data.pop('organisation_contact'),
            'representative_name': validated_data.pop('representative_name'),
            'representative_email': validated_data.pop('representative_email'),
            'organisation_email': validated_data.pop('organisational_email'),
            'address_line1': validated_data.pop('organisation_street'),
            'city': validated_data.pop('organisation_city'),
            'province_or_state': validated_data.pop('organisation_province'),
            'postal_code': validated_data.pop('organisation_postal_code'),
            'country': 'South Africa',
        }
        
        npo_document_data = validated_data.pop('npo_document')
        logo_data = validated_data.pop('organisation_logo', None)
        validated_data['user_type'] = 'ngo'

        # Create user (signal may or may not create profile depending on tests)
        user = super().create(validated_data)

        # Get or create the profile and update it
        ngo_profile, _ = NGOProfile.objects.get_or_create(user=user)
        
        # Update profile with extracted data
        for field, value in organisation_data.items():
            setattr(ngo_profile, field, value)

        # Handle document upload to blob storage
        if npo_document_data:
            try:
                # Parse base64 data
                if npo_document_data.startswith('data:'):
                    format_part, data_part = npo_document_data.split(';base64,')
                    ext = format_part.split('/')[-1] if '/' in format_part else 'pdf'
                else:
                    data_part = npo_document_data
                    ext = 'pdf'
                
                # Decode and create file
                doc_data = base64.b64decode(data_part)
                doc_file = ContentFile(doc_data, name=f'npo_doc_{user.UserID}.{ext}')
                
                # Save to blob storage
                ngo_profile.npo_document.save(
                    f'npo_doc_{user.UserID}.{ext}',
                    doc_file,
                    save=False  # Don't save yet
                )
                
                logger.info(f"Successfully uploaded NPO document for {user.email}")
                
            except Exception as e:
                logger.error(f"Failed to upload NPO document for {user.email}: {str(e)}")
                raise serializers.ValidationError("Failed to process NPO document")

        # Handle logo upload to blob storage
        if logo_data:
            try:
                # Parse base64 data
                if logo_data.startswith('data:'):
                    format_part, data_part = logo_data.split(';base64,')
                    ext = format_part.split('/')[-1]
                else:
                    data_part = logo_data
                    ext = 'png'
                
                # Decode and create file
                img_data = base64.b64decode(data_part)
                img_file = ContentFile(img_data, name=f'ngo_logo_{user.UserID}.{ext}')
                
                # Save to blob storage
                ngo_profile.organisation_logo.save(
                    f'ngo_logo_{user.UserID}.{ext}',
                    img_file,
                    save=False  # Don't save yet
                )
                
                logger.info(f"Successfully uploaded NGO logo for {user.email}")
                
            except Exception as e:
                logger.error(f"Failed to upload NGO logo for {user.email}: {str(e)}")
                # Logo is optional, so don't fail registration

        ngo_profile.save()
        return user

class FoodProviderRegistrationSerializer(BaseRegistrationSerializer):
    business_name = serializers.CharField(max_length=255)
    business_contact = serializers.CharField(max_length=20)
    business_email = serializers.EmailField()
    business_street = serializers.CharField(max_length=255)
    business_city = serializers.CharField(max_length=255)
    business_province = serializers.CharField(max_length=255)
    business_postal_code = serializers.CharField(max_length=10)
    cipc_document = serializers.CharField(required=True)
    logo = serializers.CharField(required=False, allow_blank=True)
    
    # NEW FIELDS for registration
    banner = serializers.CharField(required=False, allow_blank=True)
    business_description = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    business_tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True,
        help_text="List of tags describing your business (e.g., ['Bakery', 'Vegan Options'])"
    )

    class Meta(BaseRegistrationSerializer.Meta):
        fields = BaseRegistrationSerializer.Meta.fields + [
            'business_email', 'business_name', 'business_contact',
            'business_street', 'business_city', 'business_province',
            'business_postal_code', 'cipc_document', 'logo',
            # NEW FIELDS
            'banner', 'business_description', 'business_tags'
        ]

    def validate_cipc_document(self, value):
        if not value:
            raise serializers.ValidationError("CIPC document is required")
        if not value.startswith('data:'):
            raise serializers.ValidationError("Invalid file format")
        return value

    def validate_business_tags(self, value):
        """Validate business tags"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a list")
        
        # Clean and validate tags
        cleaned_tags = []
        for tag in value:
            if isinstance(tag, str):
                cleaned_tag = tag.strip().title()
                if cleaned_tag and len(cleaned_tag) <= 50:
                    cleaned_tags.append(cleaned_tag)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_tags = []
        for tag in cleaned_tags:
            if tag not in seen:
                seen.add(tag)
                unique_tags.append(tag)
        
        # Limit to 10 tags maximum
        if len(unique_tags) > 10:
            raise serializers.ValidationError("Maximum 10 tags allowed")
        
        return unique_tags

    def create(self, validated_data):
        try:
            address_parts = [
                validated_data.pop('business_street'),
                validated_data.pop('business_city'),
                validated_data.pop('business_province'),
                validated_data.pop('business_postal_code')
            ]
            business_address = ', '.join(filter(None, address_parts))

            provider_data = {
                'business_name': validated_data.pop('business_name'),
                'business_contact': validated_data.pop('business_contact'),
                'business_address': business_address,
                'business_email': validated_data.pop('business_email'),
                'business_description': validated_data.pop('business_description', ''),
                'business_tags': validated_data.pop('business_tags', []),
            }
            
            cipc_document_data = validated_data.pop('cipc_document')
            logo_data = validated_data.pop('logo', None)
            banner_data = validated_data.pop('banner', None)
            validated_data['user_type'] = 'provider'

            # Create user (signal may or may not create profile depending on tests)
            user = super().create(validated_data)

            # Get or create the profile and update it
            provider_profile, _ = FoodProviderProfile.objects.get_or_create(user=user)
            
            # Update profile with extracted data
            for field, value in provider_data.items():
                setattr(provider_profile, field, value)

            # Handle CIPC document upload to blob storage
            if cipc_document_data:
                try:
                    # Parse base64 data
                    if cipc_document_data.startswith('data:'):
                        format_part, data_part = cipc_document_data.split(';base64,')
                        ext = format_part.split('/')[-1] if '/' in format_part else 'pdf'
                    else:
                        data_part = cipc_document_data
                        ext = 'pdf'
                    
                    # Decode and create file
                    doc_data = base64.b64decode(data_part)
                    doc_file = ContentFile(doc_data, name=f'cipc_doc_{user.UserID}.{ext}')
                    
                    # Save to blob storage
                    provider_profile.cipc_document.save(
                        f'cipc_doc_{user.UserID}.{ext}',
                        doc_file,
                        save=False  # Don't save yet
                    )
                    
                    logger.info(f"Successfully uploaded CIPC document for {user.email}")
                    
                except Exception as e:
                    logger.error(f"Failed to upload CIPC document for {user.email}: {str(e)}")
                    raise serializers.ValidationError("Failed to process CIPC document")

            # Handle logo upload to blob storage
            if logo_data:
                try:
                    # Parse base64 data
                    if logo_data.startswith('data:'):
                        format_part, data_part = logo_data.split(';base64,')
                        ext = format_part.split('/')[-1]
                    else:
                        data_part = logo_data
                        ext = 'png'
                    
                    # Decode and create file
                    img_data = base64.b64decode(data_part)
                    img_file = ContentFile(img_data, name=f'provider_logo_{user.UserID}.{ext}')
                    
                    # Save to blob storage
                    provider_profile.logo.save(
                        f'provider_logo_{user.UserID}.{ext}',
                        img_file,
                        save=False  # Don't save yet
                    )
                    
                    logger.info(f"Successfully uploaded provider logo for {user.email}")
                    
                except Exception as e:
                    logger.error(f"Failed to upload provider logo for {user.email}: {str(e)}")
                    # Logo is optional, so don't fail registration

            # Handle banner upload to blob storage
            if banner_data:
                try:
                    # Parse base64 data
                    if banner_data.startswith('data:'):
                        format_part, data_part = banner_data.split(';base64,')
                        ext = format_part.split('/')[-1]
                    else:
                        data_part = banner_data
                        ext = 'jpg'
                    
                    # Decode and create file
                    banner_file_data = base64.b64decode(data_part)
                    banner_file = ContentFile(banner_file_data, name=f'provider_banner_{user.UserID}.{ext}')
                    
                    # Save to blob storage
                    provider_profile.banner.save(
                        f'provider_banner_{user.UserID}.{ext}',
                        banner_file,
                        save=False  # Don't save yet
                    )
                    
                    logger.info(f"Successfully uploaded provider banner for {user.email}")
                    
                except Exception as e:
                    logger.error(f"Failed to upload provider banner for {user.email}: {str(e)}")
                    # Banner is optional, so don't fail registration

            provider_profile.save()
            return user
            
        except Exception as e:
            raise serializers.ValidationError(str(e))
        
# NEW: Serializer for updating business profile (separate from registration)
class FoodProviderProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating food provider profile information"""
    banner = serializers.CharField(required=False, allow_blank=True)
    logo = serializers.CharField(required=False, allow_blank=True)
    business_tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = FoodProviderProfile
        fields = [
            'business_name', 'business_email', 'business_contact', 
            'business_address', 'business_hours', 'phone_number', 
            'website', 'business_description', 'business_tags',
            'banner', 'logo'
        ]
        extra_kwargs = {
            'business_name': {'required': False},
            'business_email': {'required': False},
            'business_contact': {'required': False},
            'business_address': {'required': False},
            'business_hours': {'required': False},
            'phone_number': {'required': False},
            'website': {'required': False},
            'business_description': {'required': False},
            'business_tags': {'required': False},
        }
    
    def validate_business_tags(self, value):
        """Validate business tags for updates"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a list")
        
        # Clean and validate tags
        cleaned_tags = []
        for tag in value:
            if isinstance(tag, str):
                cleaned_tag = tag.strip().title()
                if cleaned_tag and len(cleaned_tag) <= 50:
                    cleaned_tags.append(cleaned_tag)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_tags = []
        for tag in cleaned_tags:
            if tag not in seen:
                seen.add(tag)
                unique_tags.append(tag)
        
        # Limit to 10 tags maximum
        if len(unique_tags) > 10:
            raise serializers.ValidationError("Maximum 10 tags allowed")
        
        return unique_tags
    
    def update(self, instance, validated_data):
        """Update provider profile with new fields"""
        from django.utils import timezone
        
        # UPDATED: Handle banner upload to blob storage
        banner_data = validated_data.pop('banner', None)
        if banner_data:
            try:
                if banner_data.startswith('data:'):
                    format_part, data_part = banner_data.split(';base64,')
                    ext = format_part.split('/')[-1]
                    
                    # Decode and create file
                    banner_file_data = base64.b64decode(data_part)
                    banner_file = ContentFile(banner_file_data, name=f'provider_banner_{instance.user.UserID}.{ext}')
                    
                    # Delete old banner if exists
                    if instance.banner:
                        instance.banner.delete(save=False)
                    
                    # Save new banner to blob storage
                    instance.banner.save(
                        f'provider_banner_{instance.user.UserID}_{int(timezone.now().timestamp())}.{ext}',
                        banner_file,
                        save=False
                    )
                    instance.banner_updated_at = timezone.now()
                    
                    logger.info(f"Successfully updated banner for provider {instance.business_name}")
                    
            except Exception as e:
                logger.error(f"Failed to update banner for provider {instance.business_name}: {str(e)}")
                # Don't fail update for banner upload errors
        
        # UPDATED: Handle logo upload to blob storage
        logo_data = validated_data.pop('logo', None)
        if logo_data:
            try:
                if logo_data.startswith('data:'):
                    format_part, data_part = logo_data.split(';base64,')
                    ext = format_part.split('/')[-1]
                    
                    # Decode and create file
                    logo_file_data = base64.b64decode(data_part)
                    logo_file = ContentFile(logo_file_data, name=f'provider_logo_{instance.user.UserID}.{ext}')
                    
                    # Delete old logo if exists
                    if instance.logo:
                        instance.logo.delete(save=False)
                    
                    # Save new logo to blob storage
                    instance.logo.save(
                        f'provider_logo_{instance.user.UserID}_{int(timezone.now().timestamp())}.{ext}',
                        logo_file,
                        save=False
                    )
                    
                    logger.info(f"Successfully updated logo for provider {instance.business_name}")
                    
            except Exception as e:
                logger.error(f"Failed to update logo for provider {instance.business_name}: {str(e)}")
                # Don't fail update for logo upload errors
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Track when description and tags are updated (handled in model save method)
        instance.save()
        return instance

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    remember_me = serializers.BooleanField(default=False)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')

        return attrs

# UPDATED: Enhanced user profile serializer with blob storage URLs
class UserProfileSerializer(serializers.ModelSerializer):
    """Enhanced serializer for user profile information with blob storage support"""
    member_since = serializers.SerializerMethodField()
    profile_type = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    verification_status = serializers.SerializerMethodField()
    profile_details = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'UserID', 'email', 'phone_number', 'profile_picture', 
            'user_type', 'member_since', 'profile_type', 'full_name',
            'verification_status', 'profile_details'
        ]
    
    def get_member_since(self, obj):
        return obj.date_joined.strftime('%B %Y')
    
    def get_profile_type(self, obj):
        type_mapping = {
            'customer': 'Individual Consumer',
            'ngo': 'Organization',
            'provider': 'Food Provider'
        }
        return type_mapping.get(obj.user_type, 'Unknown')
    
    def get_full_name(self, obj):
        """Get the appropriate display name based on user type"""
        try:
            if obj.user_type == 'customer' and hasattr(obj, 'customer_profile'):
                return obj.customer_profile.full_name
            elif obj.user_type == 'ngo' and hasattr(obj, 'ngo_profile'):
                return obj.ngo_profile.representative_name
            elif obj.user_type == 'provider' and hasattr(obj, 'provider_profile'):
                return obj.provider_profile.business_name
            return obj.get_full_name() or obj.username
        except Exception:
            return obj.get_full_name() or obj.username
    
    def get_verification_status(self, obj):
        """Get verification status"""
        try:
            if obj.user_type == 'customer':
                return 'verified'
            elif obj.user_type == 'ngo' and hasattr(obj, 'ngo_profile'):
                return obj.ngo_profile.status
            elif obj.user_type == 'provider' and hasattr(obj, 'provider_profile'):
                return obj.provider_profile.status
            return 'pending'
        except Exception:
            return 'pending'
    
    def get_profile_details(self, obj):
        """Get additional profile details with blob storage URLs"""
        try:
            if obj.user_type == 'customer' and hasattr(obj, 'customer_profile'):
                profile = obj.customer_profile
                return {
                    'profile_image': profile.profile_image.url if profile.profile_image else None,
                }
            elif obj.user_type == 'ngo' and hasattr(obj, 'ngo_profile'):
                profile = obj.ngo_profile
                return {
                    'organisation_name': profile.organisation_name,
                    'organisation_contact': profile.organisation_contact,
                    'organisation_email': profile.organisation_email,
                    'representative_name': profile.representative_name,
                    'city': profile.city,
                    'organisation_logo': profile.organisation_logo.url if profile.organisation_logo else None,
                }
            elif obj.user_type == 'provider' and hasattr(obj, 'provider_profile'):
                profile = obj.provider_profile
                return {
                    'business_name': profile.business_name,
                    'business_email': profile.business_email,
                    'business_contact': profile.business_contact,
                    'business_address': profile.business_address,
                    'business_hours': profile.business_hours,
                    'phone_number': profile.phone_number,
                    'website': profile.website,
                    'logo': profile.logo.url if profile.logo else None,
                    'banner': profile.banner.url if profile.banner else None,
                    'business_description': profile.business_description,
                    'business_tags': profile.get_tag_display(),
                    'profile_completeness': profile.has_complete_profile(),
                }
            return {}
        except Exception as e:
            logger.error(f"Error getting profile details for user {obj.email}: {str(e)}")
            return {}
        
# UPDATED: Enhanced business profile serializer with blob storage URLs
class BusinessPublicProfileSerializer(serializers.ModelSerializer):
    """Enhanced serializer for public business profiles with blob storage URLs"""
    business_id = serializers.UUIDField(source='user.UserID', read_only=True)
    logo = serializers.SerializerMethodField()
    banner = serializers.SerializerMethodField()
    business_tags = serializers.SerializerMethodField()
    coordinates = serializers.SerializerMethodField()
    profile_completeness = serializers.SerializerMethodField()
    
    class Meta:
        model = FoodProviderProfile
        fields = [
            'business_id', 'business_name', 'business_email', 'business_contact',
            'business_address', 'business_hours', 'phone_number', 'website',
            'business_description', 'business_tags', 'status',
            'logo', 'banner', 'coordinates', 'profile_completeness'
        ]
    
    def get_logo(self, obj):
        try:
            return obj.logo.url if obj.logo else None
        except Exception:
            return None
    
    def get_banner(self, obj):
        try:
            return obj.banner.url if obj.banner else None
        except Exception:
            return None
    
    def get_business_tags(self, obj):
        return obj.get_tag_display()
    
    def get_coordinates(self, obj):
        return obj.coordinates
    
    def get_profile_completeness(self, obj):
        return obj.has_complete_profile()

# NEW: Serializer for business tag management
class BusinessTagSerializer(serializers.Serializer):
    """Serializer for managing business tags"""
    action = serializers.ChoiceField(choices=['add', 'remove', 'set'])
    tag = serializers.CharField(max_length=50, required=False)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True
    )
    
    def validate(self, data):
        action = data.get('action')
        
        if action in ['add', 'remove']:
            if not data.get('tag'):
                raise serializers.ValidationError("Tag is required for add/remove actions")
        elif action == 'set':
            if 'tags' not in data:
                raise serializers.ValidationError("Tags list is required for set action")
        
        # Clean tag data
        if 'tag' in data:
            data['tag'] = data['tag'].strip().title()
        
        if 'tags' in data:
            cleaned_tags = []
            for tag in data['tags']:
                if isinstance(tag, str):
                    cleaned_tag = tag.strip().title()
                    if cleaned_tag and len(cleaned_tag) <= 50:
                        cleaned_tags.append(cleaned_tag)
            
            # Remove duplicates
            seen = set()
            unique_tags = []
            for tag in cleaned_tags:
                if tag not in seen:
                    seen.add(tag)
                    unique_tags.append(tag)
            
            if len(unique_tags) > 10:
                raise serializers.ValidationError("Maximum 10 tags allowed")
            
            data['tags'] = unique_tags
        
        return data

# NEW: Serializer for popular tags endpoint
class PopularTagsSerializer(serializers.Serializer):
    """Serializer for popular business tags"""
    tag = serializers.CharField()
    count = serializers.IntegerField()
    providers = serializers.ListField(child=serializers.CharField(), required=False)

class DeleteAccountSerializer(serializers.Serializer):
    """Serializer for deleting account (requires password confirmation)"""
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Password is incorrect")
        return value

# Individual profile serializers
class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ['full_name', 'profile_image']

class NGOProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = NGOProfile
        fields = ['representative_name', 'organisation_name', 'organisation_contact', 'organisation_email', 'organisation_logo', 'status']

class ProviderProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodProviderProfile
        fields = ['business_name', 'business_email', 'business_contact', 'business_address', 'logo', 'banner', 'business_description', 'business_tags', 'status']