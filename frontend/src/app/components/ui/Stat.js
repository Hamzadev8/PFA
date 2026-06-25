/**
 * Stat — indicateur clé (KPI / spec technique). Valeur en chiffres
 * tabulaires monospacés pour une lecture "rigueur scientifique".
 */
export default function Stat({ label, value, unit, icon: Icon, hint, accent = 'text-ink', className = '' }) {
  return (
    <div className={`bg-panel-2 border border-line rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-faint shrink-0" strokeWidth={2} aria-hidden="true" />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`tabular text-xl font-semibold tracking-tight ${accent}`}>{value}</span>
        {unit && <span className="text-xs text-muted">{unit}</span>}
      </div>
      {hint && <p className="mt-1 text-[11px] text-faint leading-snug">{hint}</p>}
    </div>
  );
}
