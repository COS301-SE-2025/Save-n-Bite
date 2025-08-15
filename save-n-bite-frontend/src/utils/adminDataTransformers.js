// src/utils/adminDataTransformers.js
// Simple data transformers for admin system 

export const transformUserType = (backendType) => {
  const typeMap = {
    'customer': 'Consumer',
    'provider': 'Provider', 
    'ngo': 'NGO'
  };
  return typeMap[backendType] || backendType;
};

export const transformUserTypeToBackend = (frontendType) => {
  const typeMap = {
    'Consumer': 'customer',
    'Provider': 'provider', 
    'NGO': 'ngo'
  };
  return typeMap[frontendType] || frontendType.toLowerCase();
};

export const transformUserData = (backendUser) => {
  return {
    id: backendUser.UserID,
    name: backendUser.profile_info?.name || backendUser.username,
    email: backendUser.email,
    role: transformUserType(backendUser.user_type),
    status: backendUser.is_active ? 'Active' : 'Inactive',
    joined: backendUser.created_at,
    suspicious: false // can add logic here if needed
  };
};

export const transformVerificationData = (backendVerification) => {
  return {
    id: backendVerification.id,
    type: transformUserType(backendVerification.type),
    name: backendVerification.name,
    email: backendVerification.email,
    number: backendVerification.contact,
    submitted: backendVerification.created_at,
    status: backendVerification.status === 'pending_verification' ? 'Pending' : 
             backendVerification.status === 'verified' ? 'Approved' : 'Rejected',
    documents: Object.entries(backendVerification.documents || {}).map(([key, url]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      url: url
    }))
  };
};