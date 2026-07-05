interface LogoProps {
  size?: number
  className?: string
  spin?: boolean
}

export function Logo({ size = 32, className = '', spin = false }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="WorldWelder"
    >
      <defs>
        <linearGradient id="ww-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-a)" />
          <stop offset="50%" stopColor="var(--accent-b)" />
          <stop offset="100%" stopColor="var(--accent-c)" />
        </linearGradient>
      </defs>
      <g style={spin ? { transformOrigin: '50px 50px', animation: 'ww-spin 12s linear infinite' } : undefined}>
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#ww-g)" strokeWidth="3" opacity="0.65" />
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          stroke="url(#ww-g)"
          strokeWidth="1.5"
          opacity="0.4"
          strokeDasharray="4 3"
        />
      </g>
      <path
        d="M50 10 L50 20 M50 80 L50 90 M10 50 L20 50 M80 50 L90 50"
        stroke="url(#ww-g)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M30 68 L42 22 L50 42 L58 22 L70 68"
        fill="none"
        stroke="url(#ww-g)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="50" r="3.5" fill="url(#ww-g)" />
      <style>{`@keyframes ww-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}
