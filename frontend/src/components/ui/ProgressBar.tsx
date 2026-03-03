interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
}

export default function ProgressBar({ value, label }: ProgressBarProps) {
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-charcoal-700">{label}</span>
          <span className="text-warmgray-500">{Math.round(value)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-cream-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-sage-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
