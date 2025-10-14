import React from 'react';

interface BellNotificationIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export function BellNotificationIcon({ className, style }: BellNotificationIconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 48 48"
      width="48"
      height="48"
      className={className}
      style={style}
    >
      <path 
        fill="none" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        d="M36.268 22C37.43 32.75 42 36 42 36H6s6-4.266 6-19.2c0-3.394 1.264-6.65 3.514-9.05S20.82 4 24 4q1.014 0 2 .18M38 16a6 6 0 1 0 0-12a6 6 0 0 0 0 12m-10.54 26a4 4 0 0 1-6.92 0" 
      />
    </svg>
  );
}

export default BellNotificationIcon; 