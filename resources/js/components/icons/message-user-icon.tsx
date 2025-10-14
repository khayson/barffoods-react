import React from 'react';

interface MessageUserIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export function MessageUserIcon({ className, style }: MessageUserIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" className={className} style={style}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m13 18l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4.5M17 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0m5 5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2" />
    </svg>
  );
}

export default MessageUserIcon; 