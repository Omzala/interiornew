import { motion } from 'framer-motion';
import { LogoMark } from './Logo';
import { ease } from '../lib/motion';

/**
 * Wraps each route. On leave a curtain rises to cover the page; on enter
 * the curtain continues upward to reveal the new page.
 */
export default function PageTransition({ children, label }) {
  return (
    <>
      <motion.div
        className="curtain curtain-in"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: ease.inOut }}
      >
        <motion.div
          className="curtain-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <LogoMark size={30} />
        </motion.div>
      </motion.div>
      <motion.div
        className="curtain curtain-out"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 0 }}
        transition={{ duration: 0.9, ease: ease.inOut, delay: 0.1 }}
      >
        {label && <span className="curtain-label">{label}</span>}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 1 }}
        transition={{ duration: 1, ease: ease.out, delay: 0.35 }}
      >
        {children}
      </motion.div>
    </>
  );
}
