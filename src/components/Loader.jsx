import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { LogoMark } from './Logo';
import { ease } from '../lib/motion';

const letters = 'ANVEE'.split('');

/** Opening sequence: count up, reveal the wordmark, then lift away. */
export default function Loader({ onDone }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controls = animate(0, 100, {
      duration: 2.2,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setCount(Math.round(v)),
      onComplete: () => setTimeout(onDone, 350),
    });
    return () => controls.stop();
  }, [onDone]);

  return (
    <motion.div
      className="loader"
      initial={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ duration: 1.1, ease: ease.inOut }}
    >
      <motion.div
        className="loader-inner"
        exit={{ y: -120, opacity: 0 }}
        transition={{ duration: 0.8, ease: ease.inOut }}
      >
        <motion.div
          className="loader-mark"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: ease.out }}
        >
          <LogoMark size={44} />
        </motion.div>
        <div className="loader-word" aria-label="Anvee">
          {letters.map((l, i) => (
            <span className="reveal-mask" key={i}>
              <motion.span
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 1.1, ease: ease.out, delay: 0.25 + i * 0.08 }}
              >
                {l}
              </motion.span>
            </span>
          ))}
        </div>
        <motion.p
          className="loader-sub"
          initial={{ opacity: 0, letterSpacing: '0.2em' }}
          animate={{ opacity: 1, letterSpacing: '0.6em' }}
          transition={{ duration: 1.6, ease: ease.out, delay: 0.7 }}
        >
          Interiors
        </motion.p>
      </motion.div>

      <div className="loader-foot">
        <span>Crafting timeless spaces</span>
        <span className="loader-count">{String(count).padStart(3, '0')}</span>
      </div>
      <motion.div className="loader-bar" style={{ scaleX: count / 100 }} />
    </motion.div>
  );
}
