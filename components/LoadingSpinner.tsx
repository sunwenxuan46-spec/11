import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-culinary-gold/30 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 border-t-4 border-culinary-accent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🍽️</span>
        </div>
      </div>
      <p className="text-culinary-gold font-serif italic animate-pulse">正在寻觅全球美味...</p>
    </div>
  );
};

export default LoadingSpinner;