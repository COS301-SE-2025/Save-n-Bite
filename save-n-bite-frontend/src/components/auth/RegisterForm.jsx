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
    organisationLogo: null

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

    </form>

  );

}