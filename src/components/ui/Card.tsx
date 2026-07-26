import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-[var(--surface)] border border-[var(--hairline)] rounded-md p-7 ${className}`}>
      {children}
    </div>
  );
}
