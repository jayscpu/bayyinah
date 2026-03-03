interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

export default function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div className={`${sizes[size]} border-2 border-warmgray-300 border-t-sage-500 rounded-full animate-spin`} />
  );
}
