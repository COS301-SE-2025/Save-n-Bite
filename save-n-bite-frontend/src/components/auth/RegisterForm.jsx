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

    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    zipCode: '',
    country: '',

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
    
     {userType === USER_TYPES.CUSTOMER && (
        <>
      <label>Full Name</label>
      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} />
      {errors.fullName && <p className="error">{errors.fullName}</p>}

      <label>Email</label>
      <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
      {errors.email && <p className="error">{errors.email}</p>}

      <label>City</label>
          <input type="text" name="city" value={formData.city} onChange={handleInputChange} />
          
      <label>Province</label>
      <select name="province" value={formData.province} onChange={handleInputChange}>
        <option value="">-- Select Province --</option>
        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      {errors.province && <p className="error">{errors.province}</p>}

      <label>Password</label>
      <input type="password" name="password" value={formData.password} onChange={handleInputChange} />
      {errors.password && <p className="error">{errors.password}</p>}

      <label>Confirm Password</label>
      <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} />
      {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
      
      </>
      )};


      {userType === USER_TYPES.PROVIDER && (
        <>
          <label>Business Name</label>
          <input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange} />
          {errors.businessName && <p className="error">{errors.businessName}</p>}

         <label>Business Address</label>
          <input type="text" name="addressLine1" placeholder="Address Line 1" value={formData.addressLine1} onChange={handleInputChange} />
          {errors.addressLine1 && <p className="error">{errors.addressLine1}</p>}

        <input type="text" name="addressLine2" placeholder="Address Line 2" value={formData.addressLine2} onChange={handleInputChange} />

        <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleInputChange} />
        {errors.city && <p className="error">{errors.city}</p>}

        <select name="province" value={formData.province} onChange={handleInputChange}>
          <option value="">Select Province</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {errors.province && <p className="error">{errors.province}</p>}

        <input type="text" name="zipCode" placeholder="Zip/Postal Code" value={formData.zipCode} onChange={handleInputChange} />
        {errors.zipCode && <p className="error">{errors.zipCode}</p>}

        <input type="text" name="country" placeholder="Country" value={formData.country} onChange={handleInputChange} />
        {errors.country && <p className="error">{errors.country}</p>}

          <label>Business Contact</label>
          <input type="text" name="businessContact" value={formData.businessContact} onChange={handleInputChange} />
          {errors.businessContact && <p className="error">{errors.businessContact}</p>}

          <label>Business Email</label>
          <input type="email" name="businessEmail" value={formData.businessEmail} onChange={handleInputChange} />
          {errors.businessEmail && <p className="error">{errors.businessEmail}</p>}

          <label>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleInputChange} />
          {errors.password && <p className="error">{errors.password}</p>}

          <label>Confirm Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} />
          {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
          

          <label>CIPC Document</label>
          <input 
            type="file" 
            name="cipcDocument" 
            onChange={handleFileChange} 
            accept=".pdf,.jpg,.png" 
          />
          {errors.cipcDocument && <p className="error">{errors.cipcDocument}</p>}

          <label>Business Logo</label>
          <input 
            type="file" 
            name="logo" 
            onChange={handleFileChange} 
            accept=".jpg,.png" 
          />
          {errors.logo && <p className="error">{errors.logo}</p>}
        </>
      )}

      {userType === USER_TYPES.NGO && (
        <>
          <label>Organisation Name</label>
          <input type="text" name="organisationName" value={formData.organisationName} onChange={handleInputChange} />
          {errors.organisationName && <p className="error">{errors.organisationName}</p>}

          <label>Organisation Contact</label>
          <input type="text" name="organisationContact" value={formData.organisationContact} onChange={handleInputChange} />
          {errors.organisationContact && <p className="error">{errors.organisationContact}</p>}

          <label>Representative Name</label>
          <input type="text" name="representativeName" value={formData.representativeName} onChange={handleInputChange} />
          {errors.representativeName && <p className="error">{errors.representativeName}</p>}

          <label>Representative Email</label>
          <input type="email" name="representativeEmail" value={formData.representativeEmail} onChange={handleInputChange} />
          {errors.representativeEmail && <p className="error">{errors.representativeEmail}</p>}

          <label>Organisation Address</label>
          <input type="text" name="organisationAddress" value={formData.organisationAddress} onChange={handleInputChange} />
          {errors.organisationAddress && <p className="error">{errors.organisationAddress}</p>}
        </>
      )}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>

  );

}