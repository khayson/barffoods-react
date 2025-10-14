import React from "react";

interface ProgressIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export function ProgressIcon({ className, style }: ProgressIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className={className} style={style}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.5 7.5v6c0 3.771 0 5.657 1.172 6.828S6.729 21.5 10.5 21.5h2m9-10v-4M3.87 5.315L2.5 7.5h19l-1.252-2.087c-.854-1.423-1.28-2.134-1.969-2.524c-.687-.389-1.517-.389-3.176-.389h-6.15c-1.623 0-2.435 0-3.113.375c-.678.376-1.109 1.064-1.97 2.44M12 7.5v-5m-2 8h4m4 5v2h1.5m2.5 0a4 4 0 1 1-8 0a4 4 0 0 1 8 0"/>
    </svg>
  );
} 