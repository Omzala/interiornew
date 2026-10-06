import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import RevealText from '../components/RevealText';
import { testimonials } from '../data/site';
import { pad } from '../lib/motion';
import '../styles/testimonials.css';

const AUTO_MS = 7000;
const SWIPE_PX = 48;
const count = testimonials.length;
const total = pad(count);

/* Cards more than two places behind the front one are tucked away. */
const depthOf = (i, index) => {
  const d = (i - index + count) % count;
  return d > 2 ? 'off' : String(d);
};

function QuoteMark() {
  return (
    <svg className="tm-mark" width="46" height="36" viewBox="0 0 46 36" aria-hidden="true">
      <path
        d="M0 36V22C0 9 7 2 19 0l2 5C13 7 9.5 12 9.5 18H19v18H0zm27 0V22C27 9 34 2 46 0v5c-8 2-11.5 7-11.5 13H44v18H27z"
        fill="#c8a678"
      />
    </svg>
  );
}

function Arrow({ dir }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={dir === 'prev' ? 'M19 12H5M11 6l-6 6 6 6' : 'M5 12h14M13 6l6 6-6 6'} />
    </svg>
  );
}

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  // Once the visitor picks a card themselves, the deck stops advancing on its own.
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragged, setDragged] = useState(-1);

  const deckRef = useRef(null);
  const inView = useInView(deckRef, { amount: 0.35 });
  const reduce = useReducedMotion();

  const dragX = useMotionValue(0);
  const dragTilt = useTransform(dragX, [-240, 240], [-3, 3]);
  const still = useMotionValue(0);
  const swipe = useRef(null);
  const settling = useRef(null);

  const rotating = !pinned && !reduce && inView && !hovered && !focused;

  useEffect(() => {
    if (!rotating) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % count), AUTO_MS);
    return () => clearTimeout(id);
  }, [rotating, index]);

  useEffect(() => () => settling.current?.stop(), []);

  const show = (i) => {
    setPinned(true);
    setIndex(((i % count) + count) % count);
  };

  const settle = () => {
    settling.current?.stop();
    if (reduce) {
      dragX.set(0);
      setDragged(-1);
      return;
    }
    settling.current = animate(dragX, 0, {
      type: 'spring',
      stiffness: 260,
      damping: 30,
      onComplete: () => setDragged(-1),
    });
  };

  /* Touch swipe: horizontal drags turn the deck, vertical ones scroll the page. */
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' || !e.isPrimary) return;
    swipe.current = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false };
  };

  const onPointerMove = (e) => {
    const s = swipe.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.active) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        swipe.current = null;
        return;
      }
      s.active = true;
      settling.current?.stop();
      setDragged(index);
    }
    if (!reduce) dragX.set(dx * 0.6);
  };

  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.id !== e.pointerId || !s.active) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > SWIPE_PX) show(index + (dx < 0 ? 1 : -1));
    settle();
  };

  const onPointerCancel = () => {
    const wasActive = swipe.current?.active;
    swipe.current = null;
    if (wasActive) settle();
  };

  return (
    <section
      className="tm"
      aria-labelledby="tm-title"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <div className="tm-inner">
        <header className="tm-head">
          <div className="section-label">
            <span>(05)</span> Kind words
          </div>
          <div id="tm-title">
            <RevealText lines="Spaces that feel *completely* *theirs*" className="tm-title" />
          </div>
        </header>

        <div
          ref={deckRef}
          className="tm-deck"
          aria-live={rotating ? 'off' : 'polite'}
          onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {testimonials.map((t, i) => {
            const depth = depthOf(i, index);
            const front = depth === '0';
            const isDragged = i === dragged;
            return (
              <div
                key={t.author}
                className="tm-card"
                data-depth={depth}
                aria-hidden={front ? undefined : 'true'}
                style={{ zIndex: depth === 'off' ? 0 : 3 - Number(depth) }}
              >
                <motion.figure
                  className="tm-face"
                  style={{ x: isDragged ? dragX : still, rotate: isDragged ? dragTilt : still }}
                >
                  <QuoteMark />
                  <blockquote className="tm-quote">
                    <p>{t.quote}</p>
                  </blockquote>
                  <figcaption className="tm-cap">
                    <span>
                      <span className="tm-author">{t.author}</span>
                      <span className="tm-role">{t.role}</span>
                    </span>
                    <span className="tm-idx">
                      {pad(i + 1)} / {total}
                    </span>
                  </figcaption>
                </motion.figure>
              </div>
            );
          })}
        </div>

        <div className="tm-controls">
          <span className="tm-count" aria-hidden="true">
            {pad(index + 1)} / {total}
          </span>
          <div className="tm-buttons">
            <button type="button" className="tm-btn" onClick={() => show(index - 1)} aria-label="Previous testimonial">
              <Arrow dir="prev" />
            </button>
            {testimonials.map((t, i) => (
              <button
                key={t.author}
                type="button"
                className="tm-dot"
                onClick={() => show(i)}
                aria-label={`Show testimonial ${i + 1}`}
                aria-pressed={i === index}
              >
                <span />
              </button>
            ))}
            <button
              type="button"
              className="tm-btn tm-btn-solid"
              onClick={() => show(index + 1)}
              aria-label="Next testimonial"
            >
              <Arrow dir="next" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
