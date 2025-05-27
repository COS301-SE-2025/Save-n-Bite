import React from 'react';

export function StatusBadge({ status }) {
  const styles = {
    active: 'bg-blue-100 text-blue-800',
    expiring: 'bg-orange-100 text-orange-800',
    expired: 'bg-gray-100 text-gray-800'
  };

  const labels = {
    active: 'Active',
    expiring: 'Expiring Soon',
    expired: 'Expired'
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
