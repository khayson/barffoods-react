import React from 'react';

interface ReviewIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export function ReviewIcon({ className, style }: ReviewIconProps) {
  return (
	<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 32 32" className={className} style={style}>
		<path fill="currentColor" d="m16 8l1.912 3.703l4.088.594L19 15l1 4l-4-2.25L12 19l1-4l-3-2.703l4.2-.594z" />
		<path fill="currentColor" d="M17.736 30L16 29l4-7h6a1.997 1.997 0 0 0 2-2V8a1.997 1.997 0 0 0-2-2H6a1.997 1.997 0 0 0-2 2v12a1.997 1.997 0 0 0 2 2h9v2H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4h-4.835Z" />
	</svg>


  );
}

export default ReviewIcon; 