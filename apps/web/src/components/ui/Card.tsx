import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hoverGlow = false, className = '', ...props }) => {
  return (
    <div
      className={`bg-navy-800 border border-navy-700/80 rounded-xl p-5 backdrop-blur-sm transition-all duration-200 ${
        hoverGlow ? 'hover:border-cyan-500/40 hover:shadow-glow-cyan' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
