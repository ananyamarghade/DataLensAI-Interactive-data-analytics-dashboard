import { motion } from 'framer-motion';

interface Props {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  gradient?: boolean;
}

export function ProgressRing({ value, size = 140, stroke = 10, label, sublabel, gradient = true }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const id = `pr-${Math.round(value)}-${size}`;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3cc49b" />
            <stop offset="100%" stopColor="#1ba87f" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={gradient ? `url(#${id})` : '#1ba87f'}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight text-ink-50">{Math.round(value)}</span>
        {label && <span className="text-2xs uppercase tracking-wider text-ink-500 mt-0.5">{label}</span>}
        {sublabel && <span className="text-2xs text-ink-500 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
}
