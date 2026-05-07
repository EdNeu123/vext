interface SparklineProps {
  data: number[];
  up?: boolean;
  width?: number;
  height?: number;
}

export default function Sparkline({ data, up = true, width = 64, height = 24 }: SparklineProps) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const last = points[points.length - 1].split(',').map(Number);
  const color = up ? 'var(--green)' : 'var(--red)';

  return (
    <svg width={width} height={height} className="block overflow-visible">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  );
}
