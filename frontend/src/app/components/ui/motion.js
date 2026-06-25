'use client';
import { motion, useReducedMotion } from 'framer-motion';

/* Courbe d'easing maison (out-expo douce) — feeling Linear/Vercel */
export const EASE = [0.16, 1, 0.3, 1];

export const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/**
 * Reveal — anime un élément à son entrée dans le viewport.
 * Respecte prefers-reduced-motion (rendu statique, contenu toujours visible).
 */
export function Reveal({
  children, className = '', delay = 0, y = 16,
  once = true, amount = 0.2, as = 'div', ...props
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Tag = as;
    return <Tag className={className} {...props}>{children}</Tag>;
  }
  const M = motion[as] ?? motion.div;
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.55, ease: EASE, delay }}
      {...props}
    >
      {children}
    </M>
  );
}

/**
 * Stagger — conteneur qui orchestre l'apparition séquencée de ses enfants
 * (à utiliser avec <StaggerItem>).
 */
export function Stagger({
  children, className = '', stagger = 0.08, delay = 0.05,
  once = true, amount = 0.15, as = 'div', ...props
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Tag = as;
    return <Tag className={className} {...props}>{children}</Tag>;
  }
  const M = motion[as] ?? motion.div;
  return (
    <M
      className={className}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      {...props}
    >
      {children}
    </M>
  );
}

export function StaggerItem({ children, className = '', y = 16, as = 'div', ...props }) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Tag = as;
    return <Tag className={className} {...props}>{children}</Tag>;
  }
  const M = motion[as] ?? motion.div;
  return (
    <M
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      }}
      {...props}
    >
      {children}
    </M>
  );
}
