'use client';
import { forwardRef } from 'react';
import Link from 'next/link';

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl select-none whitespace-nowrap ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-200 ' +
  'active:scale-[0.98] cursor-pointer ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright/60 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const variants = {
  primary:   'bg-brand text-white hover:bg-brand-bright shadow-sm shadow-brand/25',
  secondary: 'bg-panel-2 text-ink border border-line hover:border-line-2 hover:bg-hover',
  outline:   'border border-line text-muted hover:text-ink hover:border-line-2 hover:bg-hover',
  ghost:     'text-muted hover:text-ink hover:bg-hover',
  danger:    'bg-rose-600 text-white hover:bg-rose-500 shadow-sm shadow-rose-600/20',
};

const sizes = {
  sm: 'text-xs px-3.5 h-9',
  md: 'text-sm px-5 h-11',
  lg: 'text-sm px-6 h-12',
};

export function buttonClasses({ variant = 'primary', size = 'md', className = '' } = {}) {
  return `${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`;
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', loading = false,
    icon: Icon, iconRight: IconRight, href, children, disabled, ...props },
  ref,
) {
  const cls = buttonClasses({ variant, size, className });
  const content = (
    <>
      {loading
        ? <Spinner />
        : Icon ? <Icon className="w-4 h-4 shrink-0" strokeWidth={2.25} aria-hidden="true" /> : null}
      {children}
      {!loading && IconRight
        ? <IconRight className="w-4 h-4 shrink-0" strokeWidth={2.25} aria-hidden="true" /> : null}
    </>
  );

  if (href && !disabled && !loading) {
    return <Link ref={ref} href={href} className={cls} {...props}>{content}</Link>;
  }
  return (
    <button ref={ref} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
});

export default Button;
