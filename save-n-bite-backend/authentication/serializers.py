# authentication/serializers.py

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, CustomerProfile, NGOProfile, FoodProviderProfile
import base64
from django.core.files.base import ContentFile

class BaseRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
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

        user = super().create(validated_data)

        customer_profile = CustomerProfile.objects.create(
            user=user,
            full_name=full_name
        )

        if profile_image_data:
            try:
                format, imgstr = profile_image_data.split(';base64,')
                ext = format.split('/')[-1]
                data = ContentFile(base64.b64decode(imgstr), name=f'profile_{user.id}.{ext}')
                customer_profile.profile_image = data
                customer_profile.save()
            except Exception as e:
                pass

        return user

class NGORegistrationSerializer(BaseRegistrationSerializer):
    organisation_name = serializers.CharField(max_length=255)
    organisation_contact = serializers.CharField(max_length=20)
    representative_name = serializers.CharField(max_length=255)
    representative_email = serializers.EmailField()  # This field is declared
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

    def validate_npo_document(self, value):
        if not value:
            raise serializers.ValidationError("NPO document is required")
        if not value.startswith('data:'):
            raise serializers.ValidationError("Invalid file format")
        return value

    def create(self, validated_data):
        # Extract NGO-specific data (don't pass to User model)
        organisation_data = {
            'organisation_name': validated_data.pop('organisation_name'),
            'organisation_contact': validated_data.pop('organisation_contact'),
            'representative_name': validated_data.pop('representative_name'),
            'representative_email': validated_data.pop('representative_email'),  # Remove from User creation
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
        
        # Store email before it gets consumed by parent create method
        user_email = validated_data.get('email')

        # Create user (only with User model fields)
        user = super().create(validated_data)

        # Create NGO profile with extracted data
        ngo_profile = NGOProfile.objects.create(
            user=user,
            **organisation_data
        )

        # Handle document upload
        if npo_document_data:
            try:
                format, docstr = npo_document_data.split(';base64,')
                ext = format.split('/')[-1] if '/' in format else 'pdf'
                doc_data = ContentFile(base64.b64decode(docstr), name=f'npo_doc_{user.UserID}.{ext}')
                ngo_profile.npo_document = doc_data
            except Exception as e:
                pass

        # Handle logo upload
        if logo_data:
            try:
                format, imgstr = logo_data.split(';base64,')
                ext = format.split('/')[-1]
                img_data = ContentFile(base64.b64decode(imgstr), name=f'ngo_logo_{user.UserID}.{ext}')
                ngo_profile.organisation_logo = img_data
            except Exception as e:
                pass

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

    class Meta(BaseRegistrationSerializer.Meta):
        fields = BaseRegistrationSerializer.Meta.fields + [
            'business_email', 'business_name', 'business_contact',
            'business_street', 'business_city', 'business_province',
            'business_postal_code', 'cipc_document', 'logo'
        ]

    def validate_cipc_document(self, value):
        if not value:
            raise serializers.ValidationError("CIPC document is required")
        if not value.startswith('data:'):
            raise serializers.ValidationError("Invalid file format")
        return value

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
            }
            cipc_document_data = validated_data.pop('cipc_document')
            logo_data = validated_data.pop('logo', None)
            validated_data['user_type'] = 'provider'

            user = super().create(validated_data)

            provider_profile = FoodProviderProfile.objects.create(
                user=user,
                **provider_data
            )

            if cipc_document_data:
                try:
                    format, docstr = cipc_document_data.split(';base64,')
                    ext = format.split('/')[-1] if '/' in format else 'pdf'
                    doc_data = ContentFile(base64.b64decode(docstr), name=f'cipc_doc_{user.id}.{ext}')
                    provider_profile.cipc_document = doc_data
                except Exception as e:
                    raise serializers.ValidationError("Invalid CIPC document format")

            if logo_data:
                try:
                    format, imgstr = logo_data.split(';base64,')
                    ext = format.split('/')[-1]
                    img_data = ContentFile(base64.b64decode(imgstr), name=f'provider_logo_{user.id}.{ext}')
                    provider_profile.logo = img_data
                except Exception as e:
                    pass

            provider_profile.save()
            return user
        except Exception as e:
            raise serializers.ValidationError(str(e))

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

class UserProfileSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    notification_preferences = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'user_type', 'role', 'profile', 'notification_preferences', 'following_count', 'followers_count']

    def get_profile(self, obj):
        if obj.user_type == 'customer' and hasattr(obj, 'customer_profile'):
            return {
                'full_name': obj.customer_profile.full_name,
                'profile_image': obj.customer_profile.profile_image.url if obj.customer_profile.profile_image else None
            }
        elif obj.user_type == 'ngo' and hasattr(obj, 'ngo_profile'):
            return {
                'organisation_name': obj.ngo_profile.organisation_name,
                'representative_name': obj.ngo_profile.representative_name,
                'organisation_email': obj.ngo_profile.organisation_email,
                'status': obj.ngo_profile.status,
                'organisation_logo': obj.ngo_profile.organisation_logo.url if obj.ngo_profile.organisation_logo else None
            }
        elif obj.user_type == 'provider' and hasattr(obj, 'provider_profile'):
            return {
                'business_name': obj.provider_profile.business_name,
                'business_email': obj.provider_profile.business_email,
                'business_address': obj.provider_profile.business_address,
                'status': obj.provider_profile.status,
                'logo': obj.provider_profile.logo.url if obj.provider_profile.logo else None
            }
        return {}

    def get_notification_preferences(self, obj):
        """Get user's notification preferences"""
        try:
            from notifications.models import NotificationPreferences
            prefs, created = NotificationPreferences.objects.get_or_create(user=obj)
            return {
                'email_notifications': prefs.email_notifications,
                'new_listing_notifications': prefs.new_listing_notifications,
                'promotional_notifications': prefs.promotional_notifications,
                'weekly_digest': prefs.weekly_digest
            }
        except:
            return {
                'email_notifications': True,
                'new_listing_notifications': True,
                'promotional_notifications': False,
                'weekly_digest': True
            }

    def get_following_count(self, obj):
        """Get count of businesses user is following (for customers/NGOs)"""
        if obj.user_type in ['customer', 'ngo']:
            try:
                from notifications.models import BusinessFollower
                return BusinessFollower.objects.filter(user=obj).count()
            except:
                return 0
        return 0

    def get_followers_count(self, obj):
        """Get count of followers for business (for providers)"""
        if obj.user_type == 'provider' and hasattr(obj, 'provider_profile'):
            try:
                from notifications.models import BusinessFollower
                return BusinessFollower.objects.filter(business=obj.provider_profile).count()
            except:
                return 0
        return 0