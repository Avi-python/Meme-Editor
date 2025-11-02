import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col justify-center items-center py-20">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      {message && <p className="text-gray-400 mt-4 text-lg animate-pulse">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
