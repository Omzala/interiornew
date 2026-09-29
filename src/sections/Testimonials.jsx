import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { testimonials } from '../data/site';
import { ease } from '../lib/motion';

const DURATION = 7000;

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setIndex((i) => (i + 1) % testimonials.length), DURATION);
    return () => clearTimeout(id);
  }, [index]);

  const t = testimonials[index];

  return (
    <section className="section testimonials">
      <div className="container testimonials-inner">
        <div className="section-label center">
          <span>(05)</span> Kind words
        </div>
        <span className="quote-mark" aria-hidden="true">“</span>

        <div className="quote-stage" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.blockquote key={index} className="quote" initial="hidden" animate="show" exit="exit">
              <p>
                {t.quote.split(' ').map((w, i) => (
                  <span className="reveal-mask" key={i}>
                    <motion.span
                      variants={{
                        hidden: { y: '110%' },
                        show: { y: '0%', transition: { duration: 0.9, ease: ease.out, delay: i * 0.025 } },
                        exit: { y: '-110%', transition: { duration: 0.5, ease: ease.inOut, delay: i * 0.008 } },
                      }}
                    >
                      {w}
                    </motion.span>
                    {' '}
                  </span>
                ))}
              </p>
              <motion.footer
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.8 } },
                  exit: { opacity: 0, transition: { duration: 0.3 } },
                }}
              >
                <strong>{t.author}</strong>
                <span>{t.role}</span>
              </motion.footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="quote-nav">
          {testimonials.map((q, i) => (
            <button key={q.author} onClick={() => setIndex(i)} aria-label={`Show testimonial ${i + 1}`}>
              <span className="quote-bar">
                {i === index && (
                  <motion.span
                    className="quote-bar-fill"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: DURATION / 1000, ease: 'linear' }}
                  />
                )}
                {i < index && <span className="quote-bar-fill is-full" />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
