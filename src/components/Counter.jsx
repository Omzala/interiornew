import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';

/** Counts up to `value` the first time it scrolls into view. */
export default function Counter({ value, suffix = '', duration = 2.2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix, duration]);

  return <span ref={ref}>0{suffix}</span>;
}
