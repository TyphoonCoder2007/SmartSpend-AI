import React from 'react';

interface AppIconProps {
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ className = "w-10 h-10" }) => (
  <svg 
    viewBox="0 0 120 120" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    aria-label="SmartSpend AI Logo"
  >
    {/* Blue Background */}
    <rect width="120" height="120" rx="28" fill="#2563EB" />
    
    {/* Bold Rupee Symbol */}
    <path 
      d="M36 40H84 M36 58H84 M50 40C75 40 75 58 50 58C42 58 38 62 38 66L82 92" 
      stroke="white" 
      strokeWidth="10" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);