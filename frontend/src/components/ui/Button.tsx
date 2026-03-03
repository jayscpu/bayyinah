import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-sage-500 text-cream-50 hover:bg-sage-600 border-sage-500 hover:border-sage-600',
  secondary: 'bg-transparent text-sage-600 border-warmgray-300 hover:border-sage-500 hover:text-sage-500',
  ghost: 'bg-transparent text-charcoal-600 border-transparent hover:bg-cream-200 hover:text-charcoal-800',
  danger: 'bg-transparent text-red-700 border-red-300 hover:bg-red-50 hover:border-red-400',
};

const sizes = {
  sm: 'px-3 py-1 text-xs tracking-wide',
  md: 'px-5 py-2 text-sm tracking-wide',
  lg: 'px-7 py-2.5 text-base tracking-wide',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`font-sans font-medium uppercase border rounded-sm transition-all duration-250 ease-out
          ${variants[variant]} ${sizes[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
