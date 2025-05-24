# authentication/serializers.py

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, CustomerProfile, NGOProfile, FoodProviderProfile
import base64
from django.core.files.base import ContentFile

class CustomerRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    full_name = serializers.CharField(max_length=255)
    profile_image = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'full_name', 'profile_image']

    def create(self, validated_data):
        full_name = validated_data.pop('full_name')
        profile_image_data = validated_data.pop('profile_image', None)

        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            user_type='customer'
        )

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


class NGORegistrationSerializer(serializers.ModelSerializer):
    organisation_name = serializers.CharField(max_length=255)
    organisation_contact = serializers.CharField(max_length=20)
    representative_name = serializers.CharField(max_length=255)
    representative_email = serializers.EmailField()
    organisational_email = serializers.EmailField()
    organisation_street = serializers.CharField(max_length=255)
    organisation_city = serializers.CharField(max_length=255)
    organisation_province = serializers.CharField(max_length=255)
    organisation_postal_code = serializers.CharField(max_length=10)
    npo_document = serializers.CharField()
    organisation_logo = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'representative_email', 'organisational_email', 'organisation_name', 'organisation_contact',
            'representative_name', 'organisation_street', 'organisation_city',
            'organisation_province', 'organisation_postal_code', 'npo_document', 'organisation_logo'
        ]

    def create(self, validated_data):
        organisation_data = {
            'organisation_name': validated_data.pop('organisation_name'),
            'organisation_contact': validated_data.pop('organisation_contact'),
            'representative_name': validated_data.pop('representative_name'),
            'organisation_email': validated_data.pop('organisational_email'),  # Map organisational_email to organisation_email
            'address_line1': validated_data.pop('organisation_street'),  # Map to address_line1
            'city': validated_data.pop('organisation_city'),
            'province_or_state': validated_data.pop('organisation_province'),  # Map to province_or_state
            'postal_code': validated_data.pop('organisation_postal_code'),
            'country': 'South Africa',  # Default country
        }
        npo_document_data = validated_data.pop('npo_document')
        logo_data = validated_data.pop('organisation_logo', None)
        representative_email = validated_data.pop('representative_email')

        user = User.objects.create_user(
            username=representative_email,
            email=representative_email,
            password='temp_password_123',
            user_type='ngo'
        )

        ngo_profile = NGOProfile.objects.create(
            user=user,
            representative_email=representative_email,
            **organisation_data
        )

        # Handle NPO document
        if npo_document_data:
            try:
                format, docstr = npo_document_data.split(';base64,')
                ext = format.split('/')[-1] if '/' in format else 'pdf'
                doc_data = ContentFile(base64.b64decode(docstr), name=f'npo_doc_{user.id}.{ext}')
                ngo_profile.npo_document = doc_data
            except Exception as e:
                pass

        # Handle organization logo
        if logo_data:
            try:
                format, imgstr = logo_data.split(';base64,')
                ext = format.split('/')[-1]
                img_data = ContentFile(base64.b64decode(imgstr), name=f'ngo_logo_{user.id}.{ext}')
                ngo_profile.organisation_logo = img_data
            except Exception as e:
                pass

        ngo_profile.save()
        return user


class FoodProviderRegistrationSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(max_length=255)
    business_contact = serializers.CharField(max_length=20)
    business_email = serializers.EmailField()
    business_street = serializers.CharField(max_length=255)
    business_city = serializers.CharField(max_length=255)
    business_province = serializers.CharField(max_length=255)
    business_postal_code = serializers.CharField(max_length=10)
    cipc_document = serializers.CharField()
    logo = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'business_email', 'business_name', 'business_contact',
            'business_street', 'business_city', 'business_province',
            'business_postal_code', 'cipc_document', 'logo'
        ]

    def create(self, validated_data):
        # Combine address fields for business_address
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
            'business_address': business_address,  # Combined address
        }
        cipc_document_data = validated_data.pop('cipc_document')
        logo_data = validated_data.pop('logo', None)
        business_email = validated_data.pop('business_email')

        user = User.objects.create_user(
            username=business_email,
            email=business_email,
            password='temp_password_123',
            user_type='provider'
        )

        provider_profile = FoodProviderProfile.objects.create(
            user=user,
            business_email=business_email,
            **provider_data
        )

        # Handle CIPC document
        if cipc_document_data:
            try:
                format, docstr = cipc_document_data.split(';base64,')
                ext = format.split('/')[-1] if '/' in format else 'pdf'
                doc_data = ContentFile(base64.b64decode(docstr), name=f'cipc_doc_{user.id}.{ext}')
                provider_profile.cipc_document = doc_data
            except Exception as e:
                pass

        # Handle logo
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

    class Meta:
        model = User
        fields = ['id', 'email', 'user_type', 'profile']

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
                'status': obj.provider_profile.status,
                'logo': obj.provider_profile.logo.url if obj.provider_profile.logo else None
            }
        return {}