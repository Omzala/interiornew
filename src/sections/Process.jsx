import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import RevealText from '../components/RevealText';
import ParallaxImage from '../components/ParallaxImage';
import { process } from '../data/site';
import { ease, pad } from '../lib/motion';

export default function Process() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.7', 'end 0.6'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section className="section process">
      <div className="container process-grid">
        <div className="process-aside">
          <div className="process-sticky">
            <div className="section-label">
              <span>(04)</span> Process
            </div>
            <RevealText lines={['From first', 'sketch to', '*final styling*']} className="section-title" />
            <ParallaxImage
              className="process-img"
              src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80"
              alt="Design process"
              width={900}
            />
          </div>
        </div>

        <div className="process-steps" ref={ref}>
          <div className="process-track">
            <motion.div className="process-fill" style={{ scaleY: progress }} />
          </div>
          {process.map((step, i) => (
            <motion.div
              key={step.title}
              className="process-step"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1, ease: ease.out }}
            >
              <span className="process-dot" />
              <span className="process-num">{pad(i + 1)}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
