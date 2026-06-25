/**
 * SectionHeading — en-tête de section cohérent : eyebrow + titre + sous-titre.
 * Pas d'emoji, typographie nette, contraste maîtrisé.
 */
export default function SectionHeading({ eyebrow, title, subtitle, align = 'center', className = '' }) {
  const alignCls = align === 'left' ? 'text-left items-start' : 'text-center items-center mx-auto';
  return (
    <div className={`flex flex-col gap-3 ${alignCls} ${align === 'center' ? 'max-w-2xl' : ''} ${className}`}>
      {eyebrow && (
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-bright">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm md:text-[15px] text-muted leading-relaxed max-w-xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
