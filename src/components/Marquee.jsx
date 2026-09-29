import { useRef } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion';
import { Star } from './Icons';

const wrap = (min, max, v) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

/** Infinite ticker whose speed and direction react to scroll velocity. */
export default function Marquee({ items, baseVelocity = -2.2, className = '' }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const skew = useTransform(smooth, [-2000, 2000], [8, -8]);
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    let move = dir.current * baseVelocity * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    move += dir.current * move * f;
    baseX.set(baseX.get() + move);
  });

  const row = items.map((item, i) => (
    <span className="marquee-item" key={i}>
      <span className={i % 2 ? 'is-outline' : ''}>{item}</span>
      <Star size={18} />
    </span>
  ));

  return (
    <div className={`marquee ${className}`} aria-hidden="true">
      <motion.div className="marquee-track" style={{ x, skewX: skew }}>
        {row}
        {row}
        {row}
        {row}
      </motion.div>
    </div>
  );
}
