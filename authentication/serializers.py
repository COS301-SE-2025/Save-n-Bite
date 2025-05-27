# authentication/serializers.py - Updated for clean models

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Individual, Business, Organisation
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
        validated_data['user_type'] = 'Individual'

        user = super().create(validated_data)
        user.username = full_name
        user.save()

        # Create Individual profile
        Individual.objects.create(
            user=user,
            date_of_birth=None  # Can be updated later
        )

        # Handle profile image
        if profile_image_data:
            try:
                format, imgstr = profile_image_data.split(';base64,')
                ext = format.split('/')[-1]
                data = ContentFile(base64.b64decode(imgstr), name=f'profile_{user.UserID}.{ext}')
                user.profile_picture = data
                user.save()
            except Exception:
                pass

        return user


class NGORegistrationSerializer(BaseRegistrationSerializer):
    organisation_name = serializers.CharField(max_length=255)
    organisation_contact = serializers.CharField(max_length=20)
    representative_name = serializers.CharField(max_length=255)
    representative_email = serializers.EmailField()
    organisation_street = serializers.CharField(max_length=255)
    organisation_city = serializers.CharField(max_length=255)
    organisation_province = serializers.CharField(max_length=255)
    organisation_postal_code = serializers.CharField(max_length=10)
    npo_document = serializers.CharField()
    organisation_logo = serializers.CharField(required=False, allow_blank=True)

    class Meta(BaseRegistrationSerializer.Meta):
        fields = BaseRegistrationSerializer.Meta.fields + [
            'organisation_name', 'organisation_contact',
            'representative_name', 'representative_email', 'organisation_street', 'organisation_city',
            'organisation_province', 'organisation_postal_code', 'npo_document', 'organisation_logo'
        ]

    def create(self, validated_data):
        organisation_info = {
            'organisation_name': validated_data.pop('organisation_name'),
            'organisation_contact': validated_data.pop('organisation_contact'),
            'representative_name': validated_data.pop('representative_name'),
            'representative_email': validated_data.pop('representative_email'),
            'street': validated_data.pop('organisation_street'),
            'city': validated_data.pop('organisation_city'),
            'province_or_state': validated_data.pop('organisation_province'),
            'postal_code': validated_data.pop('organisation_postal_code'),
            'country': 'South Africa',
        }
        npo_document_data = validated_data.pop('npo_document')
        logo_data = validated_data.pop('organisation_logo', None)
        
        validated_data['user_type'] = 'Organisation'
        user = super().create(validated_data)
        user.username = organisation_info['organisation_name']
        user.save()

        # Create Organisation profile
        organisation = Organisation.objects.create(
            user=user,
            **organisation_info
        )

        # Handle NPO document
        if npo_document_data:
            try:
                format, docstr = npo_document_data.split(';base64,')
                ext = format.split('/')[-1] if '/' in format else 'pdf'
                doc_data = ContentFile(base64.b64decode(docstr), name=f'npo_doc_{user.UserID}.{ext}')
                organisation.ngo_registration = doc_data
            except Exception:
                pass

        # Handle organization logo
        if logo_data:
            try:
                format, imgstr = logo_data.split(';base64,')
                ext = format.split('/')[-1]
                img_data = ContentFile(base64.b64decode(imgstr), name=f'ngo_logo_{user.UserID}.{ext}')
                organisation.organisation_logo = img_data
            except Exception:
                pass

        organisation.save()
        return user


class FoodProviderRegistrationSerializer(BaseRegistrationSerializer):
    business_name = serializers.CharField(max_length=255)
    business_contact = serializers.CharField(max_length=20)
    business_street = serializers.CharField(max_length=255)
    business_city = serializers.CharField(max_length=255)
    business_province = serializers.CharField(max_length=255)
    business_postal_code = serializers.CharField(max_length=10)
    cipc_document = serializers.CharField(required=True)
    logo = serializers.CharField(required=False, allow_blank=True)

    class Meta(BaseRegistrationSerializer.Meta):
        fields = BaseRegistrationSerializer.Meta.fields + [
            'business_name', 'business_contact',
            'business_street', 'business_city', 'business_province',
            'business_postal_code', 'cipc_document', 'logo'
        ]

    def validate_cipc_document(self, value):
        if not value or not value.startswith('data:'):
            raise serializers.ValidationError("Valid CIPC document is required")
        return value

    def create(self, validated_data):
        business_info = {
            'business_name': validated_data.pop('business_name'),
            'business_contact': validated_data.pop('business_contact'),
            'street': validated_data.pop('business_street'),
            'city': validated_data.pop('business_city'),
            'suburb': validated_data.pop('business_province'),
            'street_number': '0',  # Default, can be updated
        }
        validated_data.pop('business_postal_code')  # Store separately if needed
        cipc_document_data = validated_data.pop('cipc_document')
        logo_data = validated_data.pop('logo', None)
        
        validated_data['user_type'] = 'Business'
        user = super().create(validated_data)
        user.username = business_info['business_name']
        user.save()

        # Create Business profile
        business = Business.objects.create(
            user=user,
            **business_info
        )

        # Handle CIPC document
        if cipc_document_data:
            try:
                format, docstr = cipc_document_data.split(';base64,')
                ext = format.split('/')[-1] if '/' in format else 'pdf'
                doc_data = ContentFile(base64.b64decode(docstr), name=f'cipc_doc_{user.UserID}.{ext}')
                business.business_licence = doc_data
            except Exception:
                raise serializers.ValidationError("Invalid CIPC document format")

        # Handle logo
        if logo_data:
            try:
                format, imgstr = logo_data.split(';base64,')
                ext = format.split('/')[-1]
                img_data = ContentFile(base64.b64decode(imgstr), name=f'provider_logo_{user.UserID}.{ext}')
                business.logo = img_data
            except Exception:
                pass

        business.save()
        return user


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
    # Map to expected API field names
    id = serializers.UUIDField(source='UserID', read_only=True)
    user_type = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'user_type', 'role', 'profile']

    def get_user_type(self, obj):
        # Map schema user_type back to API format
        mapping = {
            'Individual': 'customer',
            'Business': 'provider', 
            'Organisation': 'ngo',
            'Admin': 'admin'
        }
        return mapping.get(obj.user_type, obj.user_type.lower())

    def get_profile(self, obj):
        if obj.user_type == 'Individual' and hasattr(obj, 'individual_profile'):
            return {
                'full_name': obj.username,
                'profile_image': obj.profile_picture.url if obj.profile_picture else None
            }
        elif obj.user_type == 'Organisation' and hasattr(obj, 'organisation_profile'):
            org = obj.organisation_profile
            return {
                'organisation_name': org.organisation_name,
                'representative_name': org.representative_name,
                'organisation_email': obj.email,
                'status': org.status,
                'organisation_logo': org.organisation_logo.url if org.organisation_logo else None
            }
        elif obj.user_type == 'Business' and hasattr(obj, 'business_profile'):
            business = obj.business_profile
            return {
                'business_name': business.business_name,
                'business_email': obj.email,
                'status': business.status,
                'logo': business.logo.url if business.logo else None
            }
        return {}