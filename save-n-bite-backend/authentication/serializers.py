# authentication/serializers.py

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, CustomerProfile, NGOProfile, FoodProviderProfile
from django.contrib.auth import get_user_model
import base64
from django.core.files.base import ContentFile

User = get_user_model()

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
    """FIXED: Corrected serializer for user profile information"""
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
        """Get verification status - FIXED to handle missing attributes"""
        try:
            if obj.user_type == 'customer':
                # Customers don't have verification_status field - they're auto-verified
                return 'verified'
            elif obj.user_type == 'ngo' and hasattr(obj, 'ngo_profile'):
                return obj.ngo_profile.status
            elif obj.user_type == 'provider' and hasattr(obj, 'provider_profile'):
                return obj.provider_profile.status
            return 'pending'
        except Exception:
            return 'pending'
    
    def get_profile_details(self, obj):
        """Get additional profile details based on user type"""
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
                    'logo': profile.logo.url if profile.logo else None,
                }
            return {}
        except Exception:
            return {}