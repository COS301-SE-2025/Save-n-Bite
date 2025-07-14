import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/authAPI';
import { validateEmail, validatePassword, validateRequired, validatePhone } from '../../utils/validators';
import { USER_TYPES } from '../../utils/constants';
import { useNavigate, Link } from 'react-router-dom';

const RegisterForm = ({ userType = USER_TYPES.CUSTOMER, onSuccess, onError }) => {
    const [formData, setFormData] = useState({
        // Customer fields
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        profileImage: null,
        city: '',
        province: '',
        
        // Provider fields
        businessName: '',
        businessContact: '',
        businessEmail: '',
        cipcDocument: null,
        logo: null,
        
        // NGO fields
        organisationName: '',
        organisationContact: '',
        organisationEmail: '',
        representativeName: '',
        representative_email: '',
        representativeSurname: '',
        npoDocument: null,
        
        // Shared address fields
        addressLine1: '',
        addressLine2: '',
        zipCode: '',
        country: 'South Africa',
    });

    const navigate = useNavigate();

    const provinces = [
        "Eastern Cape",
        "Free State",
        "Gauteng",
        "KwaZulu-Natal",
        "Limpopo",
        "Mpumalanga",
        "Northern Cape",
        "North West",
        "Western Cape",
    ];

    const [errors, setErrors] = useState({});
    const [validFields, setValidFields] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [touchedFields, setTouchedFields] = useState({});
    const validatePhone = (phone) => {
  const cleanedPhone = phone.toString().replace(/\D/g, '');

  const regex = /^0\d{9}$/;
  
  return regex.test(cleanedPhone);
};
    // Real-time validation on field change
    const validateField = (name, value) => {
        let error = '';
        let isValid = false;

        switch (name) {
            case 'email':
            case 'businessEmail':
            case 'organisationEmail':
                if (value && !validateEmail(value)) {
                    error = 'Please enter a valid email address';
                } else if (value && validateEmail(value)) {
                    isValid = true;
                }
                break;
            case 'password':
                if (value && !validatePassword(value)) {
                    error = 'Password must be at least 6 characters long';
                } else if (value && validatePassword(value)) {
                    isValid = true;
                }
                break;
            case 'confirmPassword':
                if (value && value !== formData.password) {
                    error = 'Passwords do not match';
                } else if (value && value === formData.password && value.length >= 6) {
                    isValid = true;
                }
                break;
            case 'firstName':
            case 'lastName':
            case 'businessName':
            case 'organisationName':
            case 'representativeName':
            case 'city':
            case 'addressLine1':
            case 'zipCode':
                if (value && !validateRequired(value)) {
                    error = 'This field is required';
                } else if (value && validateRequired(value)) {
                    isValid = true;
                }
                break;
            case 'businessContact':
            case 'organisationContact':
                if (value && !validatePhone(value)) {
                    error = 'Please enter a valid phone number (e.g., 0123456789)';
                } else if (value && validatePhone(value)) {
                    isValid = true;
                }
                break;
            case 'province':
                if (value && provinces.includes(value)) {
                    isValid = true;
                }
                break;
            case 'cipcDocument':
            case 'npoDocument':
                if (value) {
                    isValid = true;
                }
                break;
        }

        return { error, isValid };
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear server error when user starts typing
        if (serverError) {
            setServerError('');
        }

        // Real-time validation
        const { error, isValid } = validateField(name, value);
        
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));

        setValidFields(prev => ({
            ...prev,
            [name]: isValid
        }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouchedFields(prev => ({
            ...prev,
            [name]: true
        }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            
            // Validate file type and size
            const validTypes = name === 'cipcDocument' || name === 'npoDocument' 
                ? ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
                : ['image/jpeg', 'image/png', 'image/jpg'];
            
            const maxSize = 5 * 1024 * 1024; // 5MB
            
            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    [name]: 'Please select a valid file format'
                }));
                return;
            }
            
            if (file.size > maxSize) {
                setErrors(prev => ({
                    ...prev,
                    [name]: 'File size must be less than 5MB'
                }));
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result;
                setFormData(prev => ({
                    ...prev,
                    [name]: dataUrl
                }));
                
                // Clear error and mark as valid
                setErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
                setValidFields(prev => ({
                    ...prev,
                    [name]: true
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = getRequiredFields();

        requiredFields.forEach(field => {
            const { error } = validateField(field, formData[field]);
            if (error || !formData[field]) {
                newErrors[field] = error || 'This field is required';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getRequiredFields = () => {
        const commonFields = ['email', 'password', 'confirmPassword'];
        
        if (userType === USER_TYPES.CUSTOMER) {
            return [...commonFields, 'firstName', 'lastName', 'city', 'province'];
        } else if (userType === USER_TYPES.PROVIDER) {
            return [...commonFields, 'businessName', 'businessContact', 'businessEmail', 
                    'addressLine1', 'city', 'province', 'zipCode', 'cipcDocument'];
        } else if (userType === USER_TYPES.NGO) {
            return [...commonFields, 'organisationName', 'organisationContact', 
                    'organisationEmail', 'representativeName', 'addressLine1', 
                    'city', 'province', 'zipCode', 'npoDocument'];
        }
        return commonFields;
    };

    const isFormValid = () => {
        const requiredFields = getRequiredFields();
        return requiredFields.every(field => validFields[field] && !errors[field]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setServerError('');
        
        try {
            const response = await authAPI.register({ ...formData, userType });
            onSuccess(response);
        } catch (error) {
            const errorMessage = error?.message || 'Registration failed. Please try again.';
            setServerError(errorMessage);
            onError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const getFieldClassName = (fieldName) => {
        const baseClass = "w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors";
        
        if (errors[fieldName] && touchedFields[fieldName]) {
            return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500`;
        } else if (validFields[fieldName] && touchedFields[fieldName]) {
            return `${baseClass} border-green-500 focus:border-green-500 focus:ring-green-500`;
        }
        return `${baseClass} border-gray-300`;
    };

    const renderValidationIcon = (fieldName) => {
        if (!touchedFields[fieldName]) return null;
        
        if (errors[fieldName]) {
            return (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        } else if (validFields[fieldName]) {
            return (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        }
        return null;
    };

    const renderTooltip = (text) => (
        <div className="group relative inline-block ml-2">
            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {text}
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Server Error Message */}
            {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Registration Error</h3>
                            <p className="mt-1 text-sm text-red-700">{serverError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Common fields for all user types */}
            <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={getFieldClassName('email')}
                    placeholder="Enter your email address"
                />
                {renderValidationIcon('email')}
                {errors.email && touchedFields.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
            </div>

            <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                    {renderTooltip('Password must be at least 6 characters long')}
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={getFieldClassName('password')}
                    placeholder="Create a secure password"
                />
                {renderValidationIcon('password')}
                {errors.password && touchedFields.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
            </div>

            <div className="relative">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                </label>
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={getFieldClassName('confirmPassword')}
                    placeholder="Confirm your password"
                />
                {renderValidationIcon('confirmPassword')}
                {errors.confirmPassword && touchedFields.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
            </div>

            {userType === USER_TYPES.CUSTOMER && (
                <>
                    <div className="relative">
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getFieldClassName('firstName')}
                            placeholder="Enter your first name"
                        />
                        {renderValidationIcon('firstName')}
                        {errors.firstName && touchedFields.firstName && (
                            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                        )}
                    </div>

                    <div className="relative">
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getFieldClassName('lastName')}
                            placeholder="Enter your last name"
                        />
                        {renderValidationIcon('lastName')}
                        {errors.lastName && touchedFields.lastName && (
                            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                        )}
                    </div>

                    <div className="relative">
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                            City
                        </label>
                        <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getFieldClassName('city')}
                            placeholder="Enter your city"
                        />
                        {renderValidationIcon('city')}
                        {errors.city && touchedFields.city && (
                            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                        )}
                    </div>

                    <div className="relative">
                        <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                            Province
                        </label>
                        <select
                            id="province"
                            name="province"
                            value={formData.province}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getFieldClassName('province')}
                        >
                            <option value="">-- Select Province --</option>
                            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {renderValidationIcon('province')}
                        {errors.province && touchedFields.province && (
                            <p className="mt-1 text-sm text-red-600">{errors.province}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-1">
                            Profile Image (Optional)
                            {renderTooltip('Upload a JPG, PNG image (max 5MB)')}
                        </label>
                        <input
                            type="file"
                            id="profileImage"
                            name="profileImage"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.profileImage && (
                            <p className="mt-1 text-sm text-red-600">{errors.profileImage}</p>
                        )}
                    </div>
                </>
            )}

            {userType === USER_TYPES.PROVIDER && (
                <>
                    <div className="relative">
                        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                            Business Name
                        </label>
                        <input
                            type="text"
                            id="businessName"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getFieldClassName('businessName')}
                            placeholder="Enter your business name"
                        />
                        {renderValidationIcon('businessName')}
                        {errors.businessName && touchedFields.businessName && (
                            <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
                        )}
                    </div>

                    <div className="relative">
                        <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700 mb-1">
                            Business Email
                        </label>
                        <input
                            type="email"
                            id="businessEmail"
                            name="businessEmail"
                            value={formData.businessEmail}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getFieldClassName('businessEmail')}
                            placeholder="Enter your business email"
                        />
                        {renderValidationIcon('businessEmail')}
                        {errors.businessEmail && touchedFields.businessEmail && (
                            <p className="mt-1 text-sm text-red-600">{errors.businessEmail}</p>
                        )}
                    </div>

                    <div className="relative">
                        <label htmlFor="businessContact" className="block text-sm font-medium text-gray-700 mb-1">
                            Business Contact
                            {renderTooltip('Enter phone number (e.g., 0123456789)')}
                        </label>
                        <input
                            type="text"
                            id="businessContact"
                            name="businessContact"
                            value={formData.businessContact}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getFieldClassName('businessContact')}
                            placeholder="0123456789"
                        />
                        {renderValidationIcon('businessContact')}
                        {errors.businessContact && touchedFields.businessContact && (
                            <p className="mt-1 text-sm text-red-600">{errors.businessContact}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Address
                        </label>
                        <div className="space-y-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    id="addressLine1"
                                    name="addressLine1"
                                    placeholder="Street Address"
                                    value={formData.addressLine1}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    className={getFieldClassName('addressLine1')}
                                />
                                {renderValidationIcon('addressLine1')}
                                {errors.addressLine1 && touchedFields.addressLine1 && (
                                    <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    placeholder="City"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    className={getFieldClassName('city')}
                                />
                                {renderValidationIcon('city')}
                                {errors.city && touchedFields.city && (
                                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                                )}
                            </div>

                            <div className="relative">
                                <select
                                    id="province"
                                    name="province"
                                    value={formData.province}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    className={getFieldClassName('province')}
                                >
                                    <option value="">Select Province</option>
                                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                {renderValidationIcon('province')}
                                {errors.province && touchedFields.province && (
                                    <p className="mt-1 text-sm text-red-600">{errors.province}</p>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    id="zipCode"
                                    name="zipCode"
                                    placeholder="Postal Code"
                                    value={formData.zipCode}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    className={getFieldClassName('zipCode')}
                                />
                                {renderValidationIcon('zipCode')}
                                {errors.zipCode && touchedFields.zipCode && (
                                    <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="cipcDocument" className="block text-sm font-medium text-gray-700 mb-1">
                            CIPC Document
                            {renderTooltip('Upload PDF or image file (max 5MB)')}
                        </label>
                        <input
                            type="file"
                            id="cipcDocument"
                            name="cipcDocument"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.cipcDocument && (
                            <p className="mt-1 text-sm text-red-600">{errors.cipcDocument}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                            Business Logo (Optional)
                            {renderTooltip('Upload JPG, PNG image (max 5MB)')}
                        </label>
                        <input
                            type="file"
                            id="logo"
                            name="logo"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.logo && (
                            <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
                        )}
                    </div>
                </>
            )}

            {userType === USER_TYPES.NGO && (
                <>
                    <div className="relative">
                        <label htmlFor="organisationName" className="block text-sm font-medium text-gray-700 mb-1">
                            Organisation Name
                        </label>
                        <input
                            type="text"
                            id="organisationName"
                            name="organisationName"
                            value={formData.organisationName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getFieldClassName('organisationName')}
                            placeholder="Enter your organisation name"
                        />
                        {renderValidationIcon('organisationName')}
                        {errors.organisationName && touchedFields.organisationName && (
                            <p className="mt-1 text-sm text-red-600">{errors.organisationName}</p>
                        )}
                    </div>

                    <div className="relative">
                        <label htmlFor="organisationContact" className="block text-sm font-medium text-gray-700 mb-1">
                            Organisation Contact
                            {renderTooltip('Enter phone number (e.g., 0123456789)')}
                        </label>
                        <input
                            type="text"
                            id="organisationContact"
                            name="organisationContact"
                            value={formData.organisationContact}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getFieldClassName('organisationContact')}
                            placeholder="0123456789"
                        />
                        {renderValidationIcon('organisationContact')}
                        {errors.organisationContact && touchedFields.organisationContact && (
                            <p className="mt-1 text-sm text-red-600">{errors.organisationContact}</p>
                        )}
                    </div>

                    <div className="relative">
                        <label htmlFor="organisationEmail" className="block text-sm font-medium text-gray-700 mb-1">
                            Organisation Email
                        </label>
                        <input
                            type="email"
                            id="organisationEmail"
                            name="organisationEmail"
                            value={formData.organisationEmail}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getFieldClassName('organisationEmail')}
                            placeholder="Enter your organisation email"
                        />
                        {renderValidationIcon('organisationEmail')}
                        {errors.organisationEmail && touchedFields.organisationEmail && (
                            <p className="mt-1 text-sm text-red-600">{errors.organisationEmail}</p>
                        )}
                    </div>

                    <div className="relative">
                        <label htmlFor="representativeName" className="block text-sm font-medium text-gray-700 mb-1">
                            Representative Name
                        </label>
                        <input
                            type="text"
                            id="representativeName"
                            name="representativeName"
                            value={formData.representativeName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getFieldClassName('representativeName')}
                            placeholder="Enter representative's name"
                        />
                        {renderValidationIcon('representativeName')}
                        {errors.representativeName && touchedFields.representativeName && (
                            <p className="mt-1 text-sm text-red-600">{errors.representativeName}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organisation Address
                        </label>
                        <div className="space-y-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    id="addressLine1"
                                    name="addressLine1"
                                    placeholder="Street Address"
                                    value={formData.addressLine1}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    className={getFieldClassName('addressLine1')}
                                />
                                {renderValidationIcon('addressLine1')}
                                {errors.addressLine1 && touchedFields.addressLine1 && (
                                    <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    placeholder="City"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    className={getFieldClassName('city')}
                                />
                                {renderValidationIcon('city')}
                                {errors.city && touchedFields.city && (
                                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                                )}
                            </div>

                            <div className="relative">
                                <select
                                    id="province"
                                    name="province"
                                    value={formData.province}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    className={getFieldClassName('province')}
                                >
                                    <option value="">Select Province</option>
                                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                {renderValidationIcon('province')}
                                {errors.province && touchedFields.province && (
                                    <p className="mt-1 text-sm text-red-600">{errors.province}</p>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    id="zipCode"
                                    name="zipCode"
                                    placeholder="Postal Code"
                                    value={formData.zipCode}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    className={getFieldClassName('zipCode')}
                                />
                                {renderValidationIcon('zipCode')}
                                {errors.zipCode && touchedFields.zipCode && (
                                    <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="npoDocument" className="block text-sm font-medium text-gray-700 mb-1">
                            NPO Document
                            {renderTooltip('Upload PDF or image file (max 5MB)')}
                        </label>
                        <input
                            type="file"
                            id="npoDocument"
                            name="npoDocument"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.npoDocument && (
                            <p className="mt-1 text-sm text-red-600">{errors.npoDocument}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                            Organisation Logo (Optional)
                            {renderTooltip('Upload JPG, PNG image (max 5MB)')}
                        </label>
                        <input
                            type="file"
                            id="logo"
                            name="logo"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.logo && (
                            <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
                        )}
                    </div>
                </>
            )}

            {/* Form Status Indicator */}
            {!isFormValid() && Object.keys(touchedFields).length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Please complete all required fields</h3>
                            <p className="mt-1 text-sm text-yellow-700">
                                Make sure all fields are filled out correctly before submitting.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading || !isFormValid()}
                className={`w-full py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                    isLoading || !isFormValid()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500'
                }`}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                    </div>
                ) : (
                    'Register'
                )}
            </button>
        </form>
    );
};

export default RegisterForm;