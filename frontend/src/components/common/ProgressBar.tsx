import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  progress,
  className,
  showLabel = true,
  size = 'md',
}: ProgressBarProps) {
  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const getColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">진행률</span>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full', heights[size])}>
        <div
          className={cn('rounded-full transition-all duration-300', heights[size], getColor(progress))}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
