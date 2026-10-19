import { useId } from 'react';
import { cn } from '../../lib/cn';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  filled?: boolean;
  strokeWidth?: number;
}

export function Sparkline({
  values,
  width = 120,
  height = 36,
  className,
  filled = true,
  strokeWidth = 1.8,
}: SparklineProps) {
  const rawId = useId();
  const gradientId = `spark-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const safeValues = values.length > 1 ? values : [0, 1];
  const step = width / (safeValues.length - 1);
  const points = safeValues.map((value, index) => {
    const x = index * step;
    const y = height - (Math.min(Math.max(value, 0), 100) / 100) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const line = points.join(' ');
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('h-9 w-full text-[var(--accent)]', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.24" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {filled && <polygon points={area} fill={`url(#${gradientId})`} />}
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,157,.35))' }}
      />
    </svg>
  );
}
