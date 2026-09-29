import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ParallaxImage from '../components/ParallaxImage';
import Counter from '../components/Counter';
import { stats, studio } from '../data/site';
import { fadeUp } from '../lib/motion';

const statement =
  `${studio.name}, owned by ${studio.owner}, is a design studio for residential and commercial spaces. We combine natural materials, considered light and fine craftsmanship to make interiors that feel personal and last.`;

function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span className="scroll-word" style={{ opacity }}>
      {children}{' '}
    </motion.span>
  );
}

/** Paragraph whose words light up one by one as it scrolls through view. */
function ScrollWords({ text }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = text.split(' ');
  return (
    <p className="studio-statement" ref={ref}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  );
}

export default function Studio() {
  return (
    <section className="section studio" id="studio">
      <div className="container">
        <div className="section-label">
          <span>(01)</span> The Studio
        </div>
        <ScrollWords text={statement} />

        <div className="studio-grid">
          <ParallaxImage
            className="studio-img-a"
            src="https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&q=80"
            alt="Living room styled by Anvee"
            width={1100}
          />
          <div className="studio-copy">
            <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
              Design begins with listening. Before we sketch, we learn how you live, how your team works
              and what you want to feel when you walk through the door.
            </motion.p>
            <motion.p variants={fadeUp} custom={1} initial="hidden" whileInView="show" viewport={{ once: true }}>
              Our in-house team handles concept, detailing, procurement and site execution, so every
              decision stays true to the original idea from the first drawing to the final styling.
            </motion.p>
            <ParallaxImage
              className="studio-img-b"
              src="https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&q=80"
              alt="Material detail"
              width={800}
              from="left"
              delay={0.2}
            />
          </div>
        </div>

        <div className="stats">
          {stats.map((s, i) => (
            <motion.div
              className="stat"
              key={s.label}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.5 }}
            >
              <span className="stat-value">
                <Counter value={s.value} suffix={s.suffix} />
              </span>
              <span className="stat-label">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
