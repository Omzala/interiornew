import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import SmartImage from './SmartImage';
import { ease } from '../lib/motion';

const hiddenClip = {
  bottom: 'inset(100% 0% 0% 0%)',
  top: 'inset(0% 0% 100% 0%)',
  left: 'inset(0% 100% 0% 0%)',
  right: 'inset(0% 0% 0% 100%)',
};

/**
 * Image that unveils with a clip-path wipe when it enters the viewport and
 * drifts gently inside its frame while scrolling. The in-view trigger sits
 * on an unclipped wrapper because a fully clipped element never intersects.
 */
export default function ParallaxImage({
  src,
  alt,
  className = '',
  width = 1400,
  strength = 12,
  delay = 0,
  eager = false,
  from = 'bottom',
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`]);

  return (
    <motion.div
      ref={ref}
      className={`parallax-img ${className}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      <motion.div
        className="parallax-img-clip"
        variants={{
          hidden: { clipPath: hiddenClip[from] },
          show: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1.5, ease: ease.inOut, delay } },
        }}
      >
        <motion.div className="parallax-img-inner" style={{ y, top: `-${strength}%`, bottom: `-${strength}%` }}>
          <motion.div
            className="parallax-img-scale"
            variants={{
              hidden: { scale: 1.25 },
              show: { scale: 1, transition: { duration: 1.8, ease: ease.out, delay } },
            }}
          >
            <SmartImage src={src} alt={alt} width={width} eager={eager} />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
