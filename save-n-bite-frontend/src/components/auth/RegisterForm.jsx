import React, { useState } from 'react';
import { authAPI } from '@/services/authAPI';
import { validateEmail, validatePassword, validateRequired, validatePhone } from '@/utils/validators';
import { USER_TYPES } from '@/utils/constants';
import './RegisterForm.css';

const RegisterForm = ({ userType = USER_TYPES.CUSTOMER, onSuccess, onError}) => {
    const [formData,setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileImage: null,

    // Provider fields
    businessName: '',
    businessAddress: '',
    businessContact: '',
    businessEmail: '',
    cipcDocument: null,
    logo: null,

    // NGO fields
    organisationName: '',
    organisationContact: '',
    representativeName: '',
    representativeEmail: '',
    organisationAddress: '',
    npoDocument: null,
    organisationLogo: null,

    province: '',

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

    if (!validateRequired(formData.fullName)) {
      newErrors.fullName = 'Full name is required';
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

    if (!formData.province) {
      newErrors.province = 'Province is required';
    }

    if (userType === USER_TYPES.PROVIDER) {
      if (!validateRequired(formData.businessName)) newErrors.businessName = 'Business name is required';
      if (!validateRequired(formData.businessAddress)) newErrors.businessAddress = 'Business address is required';
      if (!validatePhone(formData.businessContact)) newErrors.businessContact = 'Valid contact number is required';
      if (!validateEmail(formData.businessEmail)) newErrors.businessEmail = 'Valid business email is required';
    }

    if (userType === USER_TYPES.NGO) {
      if (!validateRequired(formData.organisationName)) newErrors.organisationName = 'Organisation name is required';
      if (!validatePhone(formData.organisationContact)) newErrors.organisationContact = 'Valid contact number is required';
      if (!validateRequired(formData.representativeName)) newErrors.representativeName = 'Representative name is required';
      if (!validateEmail(formData.representativeEmail)) newErrors.representativeEmail = 'Valid representative email is required';
      if (!validateRequired(formData.organisationAddress)) newErrors.organisationAddress = 'Address is required';
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
          onError(error?.response?.data?.message || 'Registration failed');
        } finally {
          setIsLoading(false);
        }
    };

  return(
    <form className="register-form" onSubmit={handleSubmit}>
      <h2>
        {userType === USER_TYPES.CUSTOMER ? 'Customer': userType === USER_TYPES.PROVIDER ? 'Food Provider' : 'NGO'}
        Registration
      </h2>

      {/* Customer fields */}
      {userType === USER_TYPES.CUSTOMER && (
        <>
      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Full Name" />
      <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" />
      <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" />
      <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm Password" />
      <input type="file" name="profileImage" onChange={handleFileChange} />
      </>
      )}

      {/* Food Provider Fields */}
      {userType === USER_TYPES.PROVIDER && (
      <>
        <input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange} placeholder="Business Name" />
        <input type="text" name="businessAddress" value={formData.businessAddress} onChange={handleInputChange} placeholder="Business Address" />
        <input type="text" name="businessContact" value={formData.businessContact} onChange={handleInputChange} placeholder="Business Contact Number" />
        <input type="email" name="businessEmail" value={formData.businessEmail} onChange={handleInputChange} placeholder="Business Email" />
        <input type="file" name="cipcDocument" onChange={handleFileChange} />
        <input type="file" name="logo" onChange={handleFileChange} />
      </>
      )}

      {/* NGO Fields */}
      {userType === USER_TYPES.NGO && (
      <>
        <input type="text" name="organisationName" value={formData.organisationName} onChange={handleInputChange} placeholder="Organisation Name" />
        <input type="text" name="organisationAddress" value={formData.organisationAddress} onChange={handleInputChange} placeholder="Organisation Address" />
        <input type="text" name="organisationContact" value={formData.organisationContact} onChange={handleInputChange} placeholder="Organisation Contact" />
        <input type="text" name="representativeName" value={formData.representativeName} onChange={handleInputChange} placeholder="Representative Name" />
        <input type="email" name="representativeEmail" value={formData.representativeEmail} onChange={handleInputChange} placeholder="Representative Email" />
        <input type="file" name="npoDocument" onChange={handleFileChange} />
        <input type="file" name="organisationLogo" onChange={handleFileChange} />
      </>
      )}

       <button type="submit" disabled={isLoading}>
      {isLoading ? 'Registering...' : 'Register'}
      </button>



    </form>

  );

}