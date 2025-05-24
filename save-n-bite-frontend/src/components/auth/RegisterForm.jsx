import React, { useState } from 'react';
import { authAPI } from '../../services/authAPI';
import { validateEmail, validatePassword, validateRequired, validatePhone } from '../../utils/validators';
import { USER_TYPES } from '../../utils/constants';

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
        representativeSurname: '',
        representativeEmail: '',
        npoDocument: null,
        
        // Shared address fields
        addressLine1: '',
        addressLine2: '',
        zipCode: '',
        country: 'South Africa', // Default for all forms
    });

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
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    [name]: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Customer-specific validations
        if (userType === USER_TYPES.CUSTOMER) {
            if (!validateRequired(formData.firstName)) {
                newErrors.firstName = 'First name is required';
            }

            if (!validateRequired(formData.lastName)) {
                newErrors.lastName = 'Last name is required';
            }

            if (!validateEmail(formData.email)) {
                newErrors.email = 'Valid email is required';
            }

            if (!validatePassword(formData.password)) {
                newErrors.password = 'Password must be at least 6 characters';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }

            if (!validateRequired(formData.city)) {
                newErrors.city = 'City is required';
            }

            if (!formData.province) {
                newErrors.province = 'Province is required';
            }
        }

        // Provider-specific validations
        if (userType === USER_TYPES.PROVIDER) {
            if (!validateRequired(formData.businessName)) {
                newErrors.businessName = 'Business name is required';
            }

            if (!validatePhone(formData.businessContact)) {
                newErrors.businessContact = 'Valid contact number is required';
            }

            if (!validateEmail(formData.businessEmail)) {
                newErrors.businessEmail = 'Valid business email is required';
            }

            if (!validateRequired(formData.addressLine1)) {
                newErrors.addressLine1 = 'Address line 1 is required';
            }

            if (!validateRequired(formData.city)) {
                newErrors.city = 'City is required';
            }

            if (!formData.province) {
                newErrors.province = 'Province is required';
            }

            if (!validateRequired(formData.zipCode)) {
                newErrors.zipCode = 'Postal code is required';
            }

            if (!formData.cipcDocument) {
                newErrors.cipcDocument = 'CIPC document is required';
            }

            // Logo is optional in backend, so not required here
        }

        // NGO-specific validations
        if (userType === USER_TYPES.NGO) {
            if (!validateRequired(formData.organisationName)) {
                newErrors.organisationName = 'Organisation name is required';
            }

            if (!validatePhone(formData.organisationContact)) {
                newErrors.organisationContact = 'Valid contact number is required';
            }

            if (!validateEmail(formData.organisationEmail)) {
                newErrors.organisationEmail = 'Valid organisation email is required';
            }

            if (!validateRequired(formData.representativeName)) {
                newErrors.representativeName = 'Representative name is required';
            }

            if (!validateEmail(formData.representativeEmail)) {
                newErrors.representativeEmail = 'Valid representative email is required';
            }

            if (!validateRequired(formData.addressLine1)) {
                newErrors.addressLine1 = 'Address line 1 is required';
            }

            if (!validateRequired(formData.city)) {
                newErrors.city = 'City is required';
            }

            if (!formData.province) {
                newErrors.province = 'Province is required';
            }

            if (!validateRequired(formData.zipCode)) {
                newErrors.zipCode = 'Postal code is required';
            }

            if (!formData.npoDocument) {
                newErrors.npoDocument = 'NPO document is required';
            }

            // Logo is optional in backend, so not required here
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await authAPI.register({ ...formData, userType });
            onSuccess(response);
        } catch (error) {
            onError(error?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {userType === USER_TYPES.CUSTOMER && (
                <>
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                    </div>

                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                            City
                        </label>
                        <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                    </div>

                    <div>
                        <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                            Province
                        </label>
                        <select
                            id="province"
                            name="province"
                            value={formData.province}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">-- Select Province --</option>
                            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {errors.province && <p className="mt-1 text-sm text-red-600">{errors.province}</p>}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                    </div>

                    <div>
                        <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-1">
                            Profile Image (Optional)
                        </label>
                        <input
                            type="file"
                            id="profileImage"
                            name="profileImage"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </>
            )}

            {userType === USER_TYPES.PROVIDER && (
                <>
                    <div>
                        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                            Business Name
                        </label>
                        <input
                            type="text"
                            id="businessName"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.businessName && <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>}
                    </div>

                    <div>
                        <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700 mb-1">
                            Business Email
                        </label>
                        <input
                            type="email"
                            id="businessEmail"
                            name="businessEmail"
                            value={formData.businessEmail}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.businessEmail && <p className="mt-1 text-sm text-red-600">{errors.businessEmail}</p>}
                    </div>

                    <div>
                        <label htmlFor="businessContact" className="block text-sm font-medium text-gray-700 mb-1">
                            Business Contact
                        </label>
                        <input
                            type="text"
                            id="businessContact"
                            name="businessContact"
                            value={formData.businessContact}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.businessContact && <p className="mt-1 text-sm text-red-600">{errors.businessContact}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Address
                        </label>
                        <input
                            type="text"
                            id="addressLine1"
                            name="addressLine1"
                            placeholder="Street Address"
                            value={formData.addressLine1}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 mb-2"
                        />
                        {errors.addressLine1 && <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>}

                        <input
                            type="text"
                            id="city"
                            name="city"
                            placeholder="City"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 mb-2"
                        />
                        {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}

                        <select
                            id="province"
                            name="province"
                            value={formData.province}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 mb-2"
                        >
                            <option value="">Select Province</option>
                            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {errors.province && <p className="mt-1 text-sm text-red-600">{errors.province}</p>}

                        <input
                            type="text"
                            id="zipCode"
                            name="zipCode"
                            placeholder="Postal Code"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
                    </div>

                    <div>
                        <label htmlFor="cipcDocument" className="block text-sm font-medium text-gray-700 mb-1">
                            CIPC Document
                        </label>
                        <input
                            type="file"
                            id="cipcDocument"
                            name="cipcDocument"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.cipcDocument && <p className="mt-1 text-sm text-red-600">{errors.cipcDocument}</p>}
                    </div>

                    <div>
                        <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                            Business Logo (Optional)
                        </label>
                        <input
                            type="file"
                            id="logo"
                            name="logo"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </>
            )}

            {userType === USER_TYPES.NGO && (
                <>
                    <div>
                        <label htmlFor="organisationName" className="block text-sm font-medium text-gray-700 mb-1">
                            Organisation Name
                        </label>
                        <input
                            type="text"
                            id="organisationName"
                            name="organisationName"
                            value={formData.organisationName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.organisationName && <p className="mt-1 text-sm text-red-600">{errors.organisationName}</p>}
                    </div>

                    <div>
                        <label htmlFor="organisationContact" className="block text-sm font-medium text-gray-700 mb-1">
                            Organisation Contact
                        </label>
                        <input
                            type="text"
                            id="organisationContact"
                            name="organisationContact"
                            value={formData.organisationContact}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.organisationContact && <p className="mt-1 text-sm text-red-600">{errors.organisationContact}</p>}
                    </div>

                    <div>
                        <label htmlFor="organisationEmail" className="block text-sm font-medium text-gray-700 mb-1">
                            Organisation Email
                        </label>
                        <input
                            type="email"
                            id="organisationEmail"
                            name="organisationEmail"
                            value={formData.organisationEmail}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.organisationEmail && <p className="mt-1 text-sm text-red-600">{errors.organisationEmail}</p>}
                    </div>

                    <div>
                        <label htmlFor="representativeName" className="block text-sm font-medium text-gray-700 mb-1">
                            Representative Name
                        </label>
                        <input
                            type="text"
                            id="representativeName"
                            name="representativeName"
                            value={formData.representativeName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.representativeName && <p className="mt-1 text-sm text-red-600">{errors.representativeName}</p>}
                    </div>

                    <div>
                        <label htmlFor="representativeEmail" className="block text-sm font-medium text-gray-700 mb-1">
                            Representative Email
                        </label>
                        <input
                            type="email"
                            id="representativeEmail"
                            name="representativeEmail"
                            value={formData.representativeEmail}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.representativeEmail && <p className="mt-1 text-sm text-red-600">{errors.representativeEmail}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organisation Address
                        </label>
                        <input
                            type="text"
                            id="addressLine1"
                            name="addressLine1"
                            placeholder="Street Address"
                            value={formData.addressLine1}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 mb-2"
                        />
                        {errors.addressLine1 && <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>}

                        <input
                            type="text"
                            id="city"
                            name="city"
                            placeholder="City"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 mb-2"
                        />
                        {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}

                        <select
                            id="province"
                            name="province"
                            value={formData.province}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 mb-2"
                        >
                            <option value="">Select Province</option>
                            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {errors.province && <p className="mt-1 text-sm text-red-600">{errors.province}</p>}

                        <input
                            type="text"
                            id="zipCode"
                            name="zipCode"
                            placeholder="Postal Code"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
                    </div>

                    <div>
                        <label htmlFor="npoDocument" className="block text-sm font-medium text-gray-700 mb-1">
                            NPO Document
                        </label>
                        <input
                            type="file"
                            id="npoDocument"
                            name="npoDocument"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.npoDocument && <p className="mt-1 text-sm text-red-600">{errors.npoDocument}</p>}
                    </div>

                    <div>
                        <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                            Organisation Logo (Optional)
                        </label>
                        <input
                            type="file"
                            id="logo"
                            name="logo"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-md text-white font-medium"
                style={{
                    background: 'linear-gradient(135deg, #62BD38 0%, #1E64D5 100%)'
                }}
            >
                {isLoading ? 'Registering...' : 'Register'}
            </button>
        </form>
    );
};

export default RegisterForm;