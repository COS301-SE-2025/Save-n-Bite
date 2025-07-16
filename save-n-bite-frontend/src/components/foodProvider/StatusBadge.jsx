import React from 'react';

export function StatusBadge({ status, className = '' }) {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'urgent':
        return 'bg-amber-100 text-amber-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready for pickup':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()} ${className}`}
    >
      {status}
    </span>
  );
}
