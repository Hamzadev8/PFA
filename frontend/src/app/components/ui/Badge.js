const tones = {
  neutral: 'bg-panel-2 text-muted border-line',
  brand:   'bg-brand/10 text-brand-bright border-brand/25',
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  danger:  'bg-rose-500/10 text-rose-300 border-rose-500/25',
};

const dots = {
  neutral: 'bg-slate-500',
  brand:   'bg-brand-bright',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger:  'bg-rose-400',
};

export default function Badge({ tone = 'neutral', dot = false, pulse = false, icon: Icon, className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${tones[tone] ?? tones.neutral} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dots[tone] ?? dots.neutral} ${pulse ? 'animate-pulse' : ''}`} />}
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />}
      {children}
    </span>
  );
}
