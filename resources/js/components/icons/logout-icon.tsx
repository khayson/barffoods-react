import React from 'react';

interface LogoutIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export function LogoutIcon({ className, style }: LogoutIconProps) {
  return (
	<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" className={className} style={style}>
		<g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5">
			<path strokeLinejoin="round" d="M10 12h10m0 0l-3-3m3 3l-3 3" />
			<path d="M4 12a8 8 0 0 1 8-8m0 16a7.99 7.99 0 0 1-6.245-3" />
		</g>
	</svg>



  );
}

export default LogoutIcon; 