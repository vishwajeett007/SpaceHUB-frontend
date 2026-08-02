import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"
          aria-hidden="true"
        />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
