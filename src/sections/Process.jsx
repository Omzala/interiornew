import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import RevealText from '../components/RevealText';
import SmartImage from '../components/SmartImage';
import { process as steps } from '../data/site';
import { ease, pad } from '../lib/motion';
import '../styles/process.css';

const PHONE_QUERY = '(max-width: 700px)';
const AUTO_ADVANCE_MS = 4200;
const PALETTE_PHOTO = '/projects/vriund-residences/img_1684.jpg';
const HANDOVER_PHOTO = '/projects/hiya-horizon/img_1456.jpg';

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

/*
 * The four plates of the exploded isometric stack. Each is drawn on a 330px
 * artboard; phones scale the artboard down (see --pc-k in process.css), drop
 * the small labels and thicken a few strokes, as in Mobile.dc.html.
 */
const plates = [
  // 01 · Site survey: bronze plan lines on a measuring grid.
  <div className="pc-art pc-art-grid" key="survey">
    <svg className="pc-svg" width="330" height="330" viewBox="0 0 330 330" fill="none">
      <path className="pc-w-survey" d="M60 70H250V150H280V260H60Z" stroke="#c8a678" strokeWidth="2" />
      <path
        className="pc-sm-hide"
        d="M60 300H280M60 292V308M280 292V308M300 70V260M292 70H308M292 260H308"
        stroke="#c8a678"
        strokeWidth="1"
        opacity="0.7"
      />
      <circle cx="120" cy="180" r="4" fill="#c8a678" />
      <circle className="pc-sm-hide" cx="210" cy="120" r="4" fill="#c8a678" />
    </svg>
    <span className="pc-tag pc-tag-light" style={{ left: 18, top: 16 }}>
      01 · Site survey
    </span>
  </div>,

  // 02 · Material palette: swatches and an arched photo crop.
  <div className="pc-art pc-art-palette" key="palette">
    <span className="pc-swatch" style={{ left: 22, top: 26, width: 74, height: 74, background: '#b48a5e' }} />
    <span className="pc-swatch" style={{ left: 106, top: 60, width: 56, height: 56, background: '#d9c7ab' }} />
    <span
      className="pc-swatch"
      style={{ left: 30, top: 130, width: 90, height: 64, borderRadius: 6, background: '#8f9a7c' }}
    />
    <span className="pc-swatch" style={{ left: 132, top: 140, width: 34, height: 34, background: '#c19a5b' }} />
    <SmartImage className="pc-arch" src={PALETTE_PHOTO} width={320} alt="" />
    <span className="pc-tag pc-tag-dark" style={{ left: 22, bottom: 86 }}>
      02 · Material palette
    </span>
    <span className="pc-palette-name">Oak, travertine, sage &amp; brass</span>
  </div>,

  // 03 · Plan + 3D: a dark working drawing.
  <div className="pc-art" key="plan">
    <svg className="pc-svg" width="330" height="330" viewBox="0 0 330 330" fill="none">
      <path className="pc-w-outer" d="M40 40H290V290H40Z" stroke="#e6cda4" strokeWidth="5" />
      <path className="pc-w-wall" d="M40 170H140M190 170H290M165 40V110" stroke="#e6cda4" strokeWidth="3" />
      <path
        className="pc-sm-hide"
        d="M140 170A50 50 0 0 1 190 170"
        stroke="#c8a678"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <path className="pc-w-detail" d="M70 205A60 60 0 0 1 190 205V235H70Z" stroke="#c8a678" strokeWidth="1.5" />
      <circle className="pc-w-detail" cx="130" cy="262" r="20" stroke="#c8a678" strokeWidth="1.5" />
      <path className="pc-w-detail" d="M200 60H270V130H200Z" stroke="#c8a678" strokeWidth="1.5" />
      <path className="pc-sm-hide" d="M215 75H255V115H215Z" stroke="#c8a678" strokeWidth="1" opacity="0.6" />
      <path className="pc-sm-hide" d="M60 60H140V95H60Z" stroke="#c8a678" strokeWidth="1.5" />
      <circle className="pc-sm-hide" cx="262" cy="258" r="14" stroke="#c8a678" strokeWidth="1.5" />
    </svg>
    <span className="pc-tag pc-tag-light" style={{ left: 18, bottom: 14 }}>
      03 · Plan + 3D
    </span>
  </div>,

  // 04 · Handover: the finished room.
  <div className="pc-photo" key="handover">
    <SmartImage src={HANDOVER_PHOTO} width={660} alt="" />
    <span className="pc-art pc-art-overlay">
      <span className="pc-tag pc-pill-tag" style={{ left: 14, top: 14 }}>
        04 · Handover
      </span>
    </span>
  </div>,
];

/**
 * "How we work": the steps on the left drive an exploded isometric stack of
 * four plates on the right. The active plate lifts with a bronze edge, the
 * ones above it separate upward and fade. Auto-advances while in view until
 * the visitor picks a step.
 */
export default function Process() {
  const sectionRef = useRef(null);
  const holdRef = useRef(false);
  const [step, setStep] = useState(0);
  const [pinned, setPinned] = useState(false);
  const phone = useMedia(PHONE_QUERY);
  const reduceMotion = useReducedMotion();
  const inView = useInView(sectionRef, { amount: 0.3 });
  const uid = useId();
  const count = Math.min(steps.length, plates.length);

  useEffect(() => {
    if (pinned || reduceMotion || !inView) return undefined;
    const id = window.setInterval(() => {
      // Don't change the text under someone who is pointing at / tabbing through the list.
      if (!holdRef.current) setStep((s) => (s + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [pinned, reduceMotion, inView, count]);

  const pick = (i) => {
    setStep(i);
    setPinned(true);
  };

  const hold = {
    onPointerEnter: (e) => {
      if (e.pointerType === 'mouse') holdRef.current = true;
    },
    onPointerLeave: () => {
      holdRef.current = false;
    },
    onFocus: () => {
      holdRef.current = true;
    },
    onBlur: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) holdRef.current = false;
    },
  };

  const active = steps[step];

  const stage = (
    <motion.div
      className="pc-stage"
      aria-hidden="true"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.1, ease: ease.out, delay: 0.15 }}
    >
      <div className="pc-stack">
        <div className="pc-shadow" />
        {plates.slice(0, count).map((plate, i) => (
          <div
            key={i}
            className={`pc-plate pc-plate-${i + 1}`}
            data-state={i === step ? 'active' : i > step ? 'above' : 'below'}
            style={{ '--i': i }}
          >
            {plate}
          </div>
        ))}
      </div>
      <p className="pc-caption">
        Layer {pad(step + 1)} · {active.title}
      </p>
    </motion.div>
  );

  return (
    <section className="pc" id="process" ref={sectionRef} aria-labelledby="pc-title">
      <div className="container">
        <div className="section-label">
          <span>(03)</span> How we work
        </div>
        <div id="pc-title" className="pc-heading">
          <RevealText lines={['Four layers, *one* calm process']} className="section-title pc-title" />
        </div>

        {phone ? (
          <div className="pc-phone">
            {stage}
            <div className="pc-pills" role="group" aria-label="Process steps" {...hold}>
              {steps.slice(0, count).map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  className="pc-pill"
                  aria-pressed={i === step}
                  onClick={() => pick(i)}
                >
                  <span className="pc-pill-num" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <span className="pc-pill-title">{s.title}</span>
                </button>
              ))}
            </div>
            <div className="pc-pill-text" aria-live={pinned ? 'polite' : 'off'}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: ease.out }}
                >
                  {active.text}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="pc-body">
            <ol className="pc-steps" {...hold}>
              {steps.slice(0, count).map((s, i) => {
                const on = i === step;
                const bodyId = `${uid}-step-${i}`;
                return (
                  <motion.li
                    key={s.title}
                    className={`pc-step${on ? ' is-active' : ''}`}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.9, ease: ease.out, delay: i * 0.08 }}
                  >
                    <h3 className="pc-step-h">
                      <button
                        type="button"
                        className="pc-step-btn"
                        aria-expanded={on}
                        aria-controls={bodyId}
                        onClick={() => pick(i)}
                      >
                        <span className="pc-step-num" aria-hidden="true">
                          {pad(i + 1)}
                        </span>
                        <span className="pc-step-title">{s.title}</span>
                      </button>
                    </h3>
                    <div className="pc-step-body" id={bodyId}>
                      <div className="pc-step-clip">
                        <p className="pc-step-text">{s.text}</p>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
            {stage}
          </div>
        )}
      </div>
    </section>
  );
}
