import { useCallback, useId, useState, useSyncExternalStore } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import RevealText from '../components/RevealText';
import SmartImage from '../components/SmartImage';
import { services } from '../data/site';
import { ease, pad } from '../lib/motion';
import '../styles/services.css';

const PHONE_QUERY = '(max-width: 700px)';
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

/** Live `matchMedia` result, read synchronously on the first client render. */
function useMedia(query) {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const tiltSpring = { stiffness: 170, damping: 20, mass: 0.6 };

/**
 * One service card. On fine pointers it tilts toward the cursor in 3D: the
 * copy floats 48px above the photo, the photo drifts the other way and a soft
 * glare follows the pointer. Everything runs on motion values, so a
 * pointermove never re-renders React.
 */
function ServiceCard({ service, index, tilt }) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const lit = useMotionValue(0);
  const sx = useSpring(px, tiltSpring);
  const sy = useSpring(py, tiltSpring);
  const glareOpacity = useSpring(lit, { stiffness: 120, damping: 22 });

  const rotateX = useTransform(sy, (v) => (0.5 - v) * 14);
  const rotateY = useTransform(sx, (v) => (v - 0.5) * 18);
  const photoX = useTransform(sx, (v) => (0.5 - v) * 16);
  const photoY = useTransform(sy, (v) => (0.5 - v) * 16);
  // The glare layer is twice the card's size, so ±50% of its own box moves
  // its centre across the whole card. Transform only, no repaint per frame.
  const glareX = useTransform(sx, (v) => `${(v - 0.5) * 50}%`);
  const glareY = useTransform(sy, (v) => `${(v - 0.5) * 50}%`);

  const onPointerMove = (e) => {
    if (!tilt || e.pointerType !== 'mouse') return;
    // Measure the untransformed wrapper, not the tilted card.
    const r = e.currentTarget.getBoundingClientRect();
    px.set(clamp01((e.clientX - r.left) / Math.max(1, r.width)));
    py.set(clamp01((e.clientY - r.top) / Math.max(1, r.height)));
    lit.set(1);
  };

  const onPointerLeave = () => {
    px.set(0.5);
    py.set(0.5);
    lit.set(0);
  };

  return (
    <motion.li
      className="svc-cell"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 1, ease: ease.out, delay: index * 0.08 }}
    >
      <motion.article
        className={`svc-card${tilt ? ' is-tilt' : ''}`}
        style={tilt ? { rotateX, rotateY } : undefined}
      >
        <div className="svc-media">
          <motion.div className="svc-photo" style={{ scale: 1.1, x: photoX, y: photoY }}>
            <SmartImage src={service.image} alt={service.alt ?? ''} width={1000} />
          </motion.div>
          <span className="svc-shade" aria-hidden="true" />
          {tilt && (
            <motion.span
              className="svc-glare"
              aria-hidden="true"
              style={{ x: glareX, y: glareY, opacity: glareOpacity }}
            />
          )}
        </div>
        <div className="svc-copy">
          <span className="svc-num" aria-hidden="true">
            {pad(index + 1)}
          </span>
          <div>
            <h3 className="svc-card-title">{service.title}</h3>
            <p className="svc-card-text">{service.text}</p>
          </div>
        </div>
      </motion.article>
    </motion.li>
  );
}

/** Phone layout (Mobile.dc.html): one-open-at-a-time accordion. */
function ServiceAccordion() {
  const [open, setOpen] = useState(0);
  const uid = useId();

  return (
    <ul className="svc-acc">
      {services.map((s, i) => {
        const isOpen = open === i;
        const panelId = `${uid}-panel-${i}`;
        return (
          <li key={s.title} className="svc-acc-item">
            <h3 className="svc-acc-h">
              <button
                type="button"
                className="svc-acc-btn"
                aria-expanded={isOpen}
                aria-controls={isOpen ? panelId : undefined}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span className="svc-acc-num" aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <span className="svc-acc-title">{s.title}</span>
                <span className="svc-acc-icon" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  id={panelId}
                  className="svc-acc-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: ease.out }}
                >
                  <div className="svc-acc-body">
                    <div className="svc-acc-photo">
                      <SmartImage src={s.image} alt={s.alt ?? ''} width={1000} />
                    </div>
                    <p className="svc-acc-text">{s.text}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}

export default function Services() {
  const phone = useMedia(PHONE_QUERY);
  const finePointer = useMedia(FINE_POINTER_QUERY);
  const reduceMotion = useReducedMotion();
  const tilt = finePointer && !reduceMotion;

  return (
    <section className="svc" id="services" aria-labelledby="svc-title">
      <div className="container">
        <div className="svc-head">
          <div className="svc-heading">
            <div className="section-label">
              <span>(02)</span> What we do
            </div>
            <div id="svc-title">
              <RevealText lines={['From first sketch to the *final* *cushion*']} className="section-title svc-title" />
            </div>
          </div>
          <motion.p
            className="svc-intro"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: ease.out, delay: 0.3 }}
          >
            Our in-house team handles concept, detailing, procurement and site execution, so every decision stays true
            to the original idea.
          </motion.p>
        </div>

        {phone ? (
          <ServiceAccordion />
        ) : (
          <ul className="svc-grid">
            {services.map((s, i) => (
              <ServiceCard key={s.title} service={s} index={i} tilt={tilt} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
