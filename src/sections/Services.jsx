import { useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import RevealText from '../components/RevealText';
import SmartImage from '../components/SmartImage';
import { ArrowUpRight } from '../components/Icons';
import { services } from '../data/site';
import { ease, pad } from '../lib/motion';

/** Service list with a floating preview image that trails the pointer. */
export default function Services() {
  const [active, setActive] = useState(null);
  const listRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 20, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 150, damping: 20, mass: 0.5 });

  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = listRef.current.getBoundingClientRect();
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  return (
    <section className="section services dark" id="services">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="section-label">
              <span>(03)</span> Services
            </div>
            <RevealText lines={['What we', '*create*']} className="section-title" />
          </div>
          <motion.p
            className="section-intro"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: ease.out, delay: 0.3 }}
          >
            From a single room to a full hotel, we handle design and delivery with the same care.
          </motion.p>
        </div>

        <div className="service-list" ref={listRef} onPointerMove={onMove} onPointerLeave={() => setActive(null)}>
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              className={`service-row${active === i ? ' is-active' : ''}${active !== null && active !== i ? ' is-dim' : ''}`}
              onPointerEnter={(event) => event.pointerType === 'mouse' && setActive(i)}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.9, ease: ease.out, delay: i * 0.06 }}
            >
              <span className="service-num">{pad(i + 1)}</span>
              <h3 className="service-title">{s.title}</h3>
              <p className="service-text">{s.text}</p>
              <span className="service-arrow">
                <ArrowUpRight size={20} />
              </span>
              <motion.span
                className="service-line"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: ease.inOut, delay: i * 0.08 }}
              />
            </motion.div>
          ))}

          <motion.div className="service-float" style={{ x: sx, y: sy }} aria-hidden="true">
            <AnimatePresence>
              {active !== null && (
                <motion.div
                  key={active}
                  className="service-float-img"
                  initial={{ opacity: 0, scale: 0.6, rotate: -6 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 4 }}
                  transition={{ duration: 0.45, ease: ease.out }}
                >
                  <SmartImage src={services[active].image} alt="" width={600} eager />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
