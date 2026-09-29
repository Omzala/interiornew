import { createContext, useContext } from 'react';

export const LenisContext = createContext(null);

export const useLenis = () => useContext(LenisContext);

/** Scroll to a section id (or 'top') using Lenis when available. */
export function scrollToTarget(lenis, target, opts = {}) {
  if (target === 0 || target === 'top') {
    if (lenis) lenis.scrollTo(0, { force: true, ...opts });
    else window.scrollTo({ top: 0, behavior: opts.immediate ? 'auto' : 'smooth' });
    return;
  }
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -20, duration: 1.6, force: true, ...opts });
  else el.scrollIntoView({ behavior: opts.immediate ? 'auto' : 'smooth' });
}
