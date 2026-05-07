interface AvatarProps {
  initials: string;
  size?: number;
  color?: string;
  status?: 'online' | 'offline' | 'away';
}

const STATUS_COLORS: Record<NonNullable<AvatarProps['status']>, string> = {
  online: '#22C55E',
  offline: '#9CA3AF',
  away: '#F59E0B',
};

export default function Avatar({
  initials,
  size = 32,
  color = '#A8C5F5',
  status,
}: AvatarProps) {
  const dotSize = Math.max(size * 0.27, 8);

  return (
    <div className="relative inline-flex flex-shrink-0">
      <div
        className="flex items-center justify-center rounded-full font-semibold text-[#1A1917] flex-shrink-0"
        style={{
          width: size,
          height: size,
          background: color,
          fontSize: size * 0.38,
        }}
      >
        {initials}
      </div>
      {status && (
        <div
          className="absolute bottom-0 right-0 rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            background: STATUS_COLORS[status],
            border: '2px solid var(--surface)',
          }}
        />
      )}
    </div>
  );
}
