import Link from 'next/link';

/**
 * Card — surface de base : panneau sombre, bordure hairline, rayon 2xl.
 * `interactive` (ou `href`) ajoute un survol stable (bordure + léger lift,
 * via transform → aucun reflow). `glow` accepte glow-blue|green|red|purple.
 */
export default function Card({
  as: Tag = 'div', href, interactive = false, glow = '', className = '', children, ...props
}) {
  const base = 'bg-panel border border-line rounded-2xl';
  const hover = (interactive || href)
    ? 'transition-[border-color,transform,box-shadow] duration-200 hover:border-line-2 ' +
      'hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85)] cursor-pointer ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright/50 ' +
      'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas'
    : '';
  const cls = `${base} ${hover} ${glow} ${className}`.trim();

  if (href) {
    return <Link href={href} className={cls} {...props}>{children}</Link>;
  }
  return <Tag className={cls} {...props}>{children}</Tag>;
}
