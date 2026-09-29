import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

/**
 * Custom cursor: a precise dot plus a trailing ring. Any element with a
 * `data-cursor="Label"` attribute grows the ring and shows the label.
 * Only active on devices with a fine pointer.
 */
export default function Cursor() {
  const [enabled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
  const [label, setLabel] = useState('');
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add('has-cursor');

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const over = (e) => {
      const labelled = e.target.closest('[data-cursor]');
      const interactive = e.target.closest('a, button, [role="button"], input, textarea, select, label');
      setLabel(labelled ? labelled.dataset.cursor : '');
      setHovering(Boolean(interactive) && !labelled);
    };
    const leave = () => setVisible(false);

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);
    document.addEventListener('pointerleave', leave);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      document.removeEventListener('pointerleave', leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size = label ? 96 : hovering ? 56 : 34;

  return (
    <>
      <motion.div
        className={`cursor-ring${label ? ' has-label' : ''}`}
        style={{ x: rx, y: ry }}
        animate={{ width: size, height: size, opacity: visible ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        <AnimatePresence>
          {label && (
            <motion.span
              key={label}
              className="cursor-label"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.25 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      <motion.div
        className="cursor-dot"
        style={{ x, y }}
        animate={{ opacity: visible && !label ? 1 : 0, scale: hovering ? 0 : 1 }}
      />
    </>
  );
}
