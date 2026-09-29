import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import RevealText from '../components/RevealText';
import Magnetic from '../components/Magnetic';
import SmartImage from '../components/SmartImage';
import { ArrowRight } from '../components/Icons';
import { useIntroDone } from '../lib/intro';
import useSectionNav from '../lib/useSectionNav';
import { heroImages } from '../data/site';
import { ease } from '../lib/motion';

function Slideshow({ images, play }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), 5200);
    return () => clearInterval(id);
  }, [play, images.length]);

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={index}
        className="hero-slide"
        initial={{ clipPath: 'inset(100% 0% 0% 0%)', zIndex: 2 }}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)', zIndex: 2 }}
        exit={{ zIndex: 1, transition: { delay: 1.4, duration: 0 } }}
        transition={{ duration: 1.4, ease: ease.inOut }}
      >
        <motion.div
          className="hero-slide-img"
          initial={{ scale: 1.3 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 6.5, ease: ease.out }}
        >
          <SmartImage src={images[index]} alt="Interior by Anvee" width={1400} eager />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RotatingBadge() {
  return (
    <motion.svg
      className="hero-badge"
      viewBox="0 0 120 120"
      animate={{ rotate: 360 }}
      transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
      aria-hidden="true"
    >
      <defs>
        <path id="badge-circle" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" />
      </defs>
      <text>
        <textPath href="#badge-circle" textLength="286" lengthAdjust="spacing">
          ANVEE INTERIORS • DESIGN STUDIO •
        </textPath>
      </text>
    </motion.svg>
  );
}

export default function Hero() {
  const ready = useIntroDone();
  const go = useSectionNav();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const secondaryY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  const appear = (delay) => ({
    initial: { opacity: 0, y: 30 },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 },
    transition: { duration: 1.2, ease: ease.out, delay },
  });

  return (
    <section className="hero" id="top" ref={ref}>
      <div className="container hero-grid">
        <motion.div className="hero-copy" style={{ y: copyY, opacity: copyOpacity }}>
          <motion.p className="eyebrow" {...appear(0.1)}>
            <span className="eyebrow-line" /> Interior Design Studio
          </motion.p>
          <RevealText
            as="h1"
            className="hero-title"
            lines={['Spaces that', 'breathe *quiet*', '*elegance.*']}
            play={ready}
            delay={0.15}
            stagger={0.08}
          />
          <motion.p className="hero-lead" {...appear(0.7)}>
            Anvee Interiors designs homes and workplaces with natural materials, soft light and careful
            craftsmanship. Each space is shaped around the people who use it.
          </motion.p>
          <motion.div className="hero-ctas" {...appear(0.85)}>
            <Magnetic>
              <button className="btn btn-solid" onClick={() => go('projects')}>
                <span>Explore projects</span>
                <ArrowRight />
              </button>
            </Magnetic>
            <button className="btn-link" onClick={() => go('studio')}>
              Our studio
            </button>
          </motion.div>
        </motion.div>

        <div className="hero-visual">
          <motion.div
            className="hero-arch"
            style={{ y: visualY }}
            initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
            animate={
              ready
                ? { clipPath: 'inset(0% 0% 0% 0%)' }
                : { clipPath: 'inset(100% 0% 0% 0%)' }
            }
            transition={{ duration: 1.6, ease: ease.inOut, delay: 0.1 }}
          >
            <Slideshow images={heroImages} play={ready} />
          </motion.div>

          <motion.div
            className="hero-secondary"
            style={{ y: secondaryY }}
            initial={{ clipPath: 'inset(0% 100% 0% 0%)' }}
            animate={ready ? { clipPath: 'inset(0% 0% 0% 0%)' } : {}}
            transition={{ duration: 1.3, ease: ease.inOut, delay: 0.9 }}
          >
            <SmartImage src={heroImages[2]} alt="Bedroom detail" width={600} eager />
          </motion.div>

          <motion.div
            className="hero-badge-wrap"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={ready ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.2, ease: ease.out, delay: 1.2 }}
          >
            <RotatingBadge />
            <span className="hero-badge-core">✦</span>
          </motion.div>
        </div>
      </div>

      <motion.div className="container hero-foot" {...appear(1.1)}>
        <span>Residential — Commercial — Hospitality</span>
        <span className="scroll-cue">
          Scroll
          <span className="scroll-cue-line" />
        </span>
      </motion.div>
    </section>
  );
}
