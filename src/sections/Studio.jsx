import { useCallback, useRef, useSyncExternalStore } from 'react';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import SmartImage from '../components/SmartImage';
import { LogoMark } from '../components/Logo';
import { projects } from '../data/projects';
import { studio } from '../data/site';
import { ease, fadeUp } from '../lib/motion';
import '../styles/studio.css';

/* Words wrapped in *asterisks* are set in the italic bronze accent. */
const statement =
  `${studio.name}, owned by ${studio.owner}, is a design studio for residential and commercial spaces. We combine *natural materials*, *considered light* and *fine craftsmanship* to make interiors that feel personal and last.`;

/** Splits the statement into words, tracking *italic runs* and trailing punctuation. */
function tokenize(text) {
  let italic = false;
  return text.split(' ').map((raw) => {
    let word = raw;
    if (word.startsWith('*')) {
      italic = true;
      word = word.slice(1);
    }
    const isItalic = italic;
    let tail = '';
    const close = word.match(/^(.*?)\*([.,;:!?]*)$/);
    if (close) {
      word = close[1];
      tail = close[2];
      italic = false;
    }
    return { word, tail, italic: isItalic };
  });
}

const tokens = tokenize(statement);

/** A project photo with its caption from the project library as alt text. */
function projectPhoto(slug, id) {
  const project = projects.find((p) => p.slug === slug);
  const src = `/projects/${slug}/img_${id}.jpg`;
  const image = project?.images.find((img) => img.src === src);
  return { src, alt: image ? `${image.caption}, ${project.title}` : project?.title ?? '' };
}

const archPhoto = projectPhoto('vriund-residences', 1661);
const framePhoto = projectPhoto('hiya-horizon', 2227);
const swatches = ['#e8e0d1', '#b48a5e', '#8f9a7c', '#c19a5b'];

/* Resting angle of the collage and how far the pointer can swing it. */
const REST_X = 3;
const REST_Y = -9;
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

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

function Word({ token, progress, range }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span className="sd-word" style={{ opacity }}>
      {token.italic ? <em>{token.word}</em> : token.word}
      {token.tail}{' '}
    </motion.span>
  );
}

/** Statement whose words light up one by one as it scrolls through view. */
function ScrollWords() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const n = tokens.length;
  return (
    <h2 className="sd-statement" id="sd-title" ref={ref}>
      {tokens.map((t, i) =>
        reduce ? (
          <span className="sd-word" key={i}>
            {t.italic ? <em>{t.word}</em> : t.word}
            {t.tail}{' '}
          </span>
        ) : (
          <Word key={i} token={t} progress={scrollYProgress} range={[i / n, (i + 1) / n]} />
        ),
      )}
    </h2>
  );
}

const layer = {
  hidden: { opacity: 0, y: 56 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: ease.out, delay: 0.1 + i * 0.12 },
  }),
};

/**
 * Layered arch collage in a perspective box. A mouse tilts it toward the
 * pointer; on touch screens it turns gently as the page scrolls.
 */
function Collage() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const finePointer = useMedia(FINE_POINTER);

  const rx = useMotionValue(REST_X);
  const ry = useMotionValue(REST_Y);
  const rotateX = useSpring(rx, { stiffness: 80, damping: 18, mass: 0.9 });
  const rotateY = useSpring(ry, { stiffness: 80, damping: 18, mass: 0.9 });

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (finePointer || reduce) return;
    rx.set(REST_X + (0.5 - p) * 6);
    ry.set(REST_Y + (p - 0.5) * 10);
  });

  const onPointerMove = (e) => {
    if (reduce || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(1, r.width);
    const y = (e.clientY - r.top) / Math.max(1, r.height);
    rx.set((0.5 - y) * 10);
    ry.set((x - 0.5) * 14);
  };

  const onPointerLeave = (e) => {
    if (e.pointerType !== 'mouse') return;
    rx.set(REST_X);
    ry.set(REST_Y);
  };

  return (
    <motion.div
      ref={ref}
      className="sd-collage"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      <motion.div className="sd-stage" style={{ rotateX, rotateY }}>
        <motion.span className="sd-outline" aria-hidden="true" style={{ z: -90 }} variants={layer} custom={0} />
        <motion.div className="sd-arch" variants={layer} custom={1}>
          <SmartImage src={archPhoto.src} alt={archPhoto.alt} width={1000} />
        </motion.div>
        <motion.div className="sd-frame" style={{ z: 90 }} variants={layer} custom={2}>
          <SmartImage src={framePhoto.src} alt={framePhoto.alt} width={1000} />
        </motion.div>
        <motion.div className="sd-chip" aria-hidden="true" style={{ z: 140 }} variants={layer} custom={3}>
          <p className="sd-chip-label">Palette</p>
          <div className="sd-chip-swatches">
            {swatches.map((c) => (
              <span key={c} style={{ background: c }} />
            ))}
          </div>
        </motion.div>
        <motion.div className="sd-badge" aria-hidden="true" style={{ z: 170 }} variants={layer} custom={4}>
          <svg viewBox="0 0 120 120" width="124" height="124">
            <defs>
              <path id="sd-badge-ring" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" />
            </defs>
            <circle cx="60" cy="60" r="59" fill="#15120f" />
            <text fill="#e6cda4" fontSize="9.6" letterSpacing="2.6" fontFamily="Jost, sans-serif">
              <textPath href="#sd-badge-ring">ANVEE INTERIORS · DESIGN STUDIO ·</textPath>
            </text>
            <path d="M60 50l2.4 7.6L70 60l-7.6 2.4L60 70l-2.4-7.6L50 60l7.6-2.4z" fill="#c8a678" />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Studio() {
  return (
    <section className="sd" id="studio" aria-labelledby="sd-title">
      <div className="sd-inner">
        <div className="sd-copy">
          <div className="section-label">
            <span>(04)</span> The studio
          </div>
          <ScrollWords />

          <div className="sd-paras">
            <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }}>
              Design begins with listening. Before we sketch, we learn how you live, how your team works
              and what you want to feel when you walk through the door.
            </motion.p>
            <motion.p
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.6 }}
            >
              Our in-house team handles concept, detailing, procurement and site execution, so every
              decision stays true to the original idea from the first drawing to the final styling.
            </motion.p>
          </div>

          <motion.div
            className="sd-sign"
            variants={fadeUp}
            custom={2}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.8 }}
          >
            <span className="sd-sign-mark">
              <LogoMark size={24} />
            </span>
            <div>
              <p className="sd-sign-name">{studio.owner}</p>
              <p className="sd-sign-role">Owner, {studio.name}</p>
            </div>
          </motion.div>
        </div>

        <Collage />
      </div>
    </section>
  );
}
