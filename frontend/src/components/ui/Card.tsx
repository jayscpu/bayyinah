import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  decorative?: boolean;
}

export default function Card({ decorative = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`card-paper rounded-sm p-6
        ${decorative ? 'decorative-corners' : 'border border-warmgray-200'}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
