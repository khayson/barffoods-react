import React from 'react';

interface MessageCircleStudentIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export function MessageCircleStudentIcon({ className, style }: MessageCircleStudentIconProps) {
  return (

	<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" className={className} style={style}>
		<path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9h8m-8 3h8m-8 3h3m10-3a9 9 0 0 1-13.815 7.605L3 21l1.395-4.185A9 9 0 1 1 21 12" />
	</svg>

  );
}

export default MessageCircleStudentIcon; 