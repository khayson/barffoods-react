import React from 'react';

interface CalendarCheckIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export function CalendarCheckIcon({ className, style }: CalendarCheckIconProps) {
  return (

	<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 48 48" className={className} style={style}>
		<g fill="none" stroke="currentColor" strokeWidth="4">
			<path strokeLinejoin="round" d="M5 19h38v22a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zm0-9a2 2 0 0 1 2-2h34a2 2 0 0 1 2 2v9H5z" />
			<path strokeLinecap="round" strokeLinejoin="round" d="m16 31l6 6l12-12" />
			<path strokeLinecap="round" d="M16 5v8m16-8v8" />
		</g>
	</svg>
	


  );
}

export default CalendarCheckIcon; 