import React from 'react';

interface MessageIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export function MessageIcon({ className, style }: MessageIconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 48 48"
      width="48"
      height="48"
      className={className}
      style={style}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 36.792V31h-4a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H24l-6.146 6.146a.5.5 0 0 1-.854-.354Z" />
        <path strokeLinecap="round" d="M17 25h14m-14-6h14" />
      </g>
    </svg>
  );
}

export default MessageIcon; 