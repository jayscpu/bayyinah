interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

const variants = {
  default: 'bg-cream-200 text-charcoal-600 border-warmgray-300',
  success: 'bg-sage-300/20 text-sage-700 border-sage-300',
  warning: 'bg-gold-400/20 text-gold-500 border-gold-400/40',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-sm border ${variants[variant]}`}>
      {children}
    </span>
  );
}
