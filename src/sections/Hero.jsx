import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { animate, motion, useReducedMotion } from 'framer-motion';
import RevealText from '../components/RevealText';
import Room3D from '../components/Room3D';
import { useIntroDone } from '../lib/intro';
import useSectionNav from '../lib/useSectionNav';
import { ease } from '../lib/motion';
import useMedia from '../lib/useMedia';
import { stats } from '../data/site';
import { moods, palettes, defaultMood, defaultPalette } from '../data/room';
import '../styles/hero.css';

/*
 * Home hero: the live 3D room with copy, a control dock and studio numbers.
 * Design: Main.dc.html (>= 980px, full-bleed stage with the room shifted
 * right) and Mobile.dc.html (phones: copy, stage, scrollable control row,
 * 2x2 numbers). Classes use the `hx-` prefix.
 */

const WIDE_QUERY = '(min-width: 980px)';
// Small desktops: push the room a little further right and smaller so it clears the copy.
const ROOMY_QUERY = '(min-width: 1200px)';

/** Room framing per layout: [shift, zoom]. */
const framing = (wide, roomy) => {
  if (!wide) return [0, 1.04];
  return roomy ? [0.2, 0.8] : [0.24, 0.76];
};

const ICON_INSIDE = 'M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M3 21h18M14 12h.01';
const ICON_OVERVIEW = 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5';
const ICON_ORBIT = 'M3 12a9 9 0 0 1 15.5-6.2M21 12a9 9 0 0 1-15.5 6.2M18 2.5v3.5h-3.5M6 21.5V18h3.5';

function StrokeIcon({ d, size = 17, width = 1.5 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/** A studio number that counts up once the loader has lifted (static with reduced motion). */
function StatValue({ value, suffix, play, delay }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!play || reduce || !node) return undefined;
    node.textContent = `0${suffix}`;
    const controls = animate(0, value, {
      duration: 2,
      delay,
      ease: ease.out,
      onUpdate: (v) => {
        node.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => {
      controls.stop();
      node.textContent = `${value}${suffix}`;
    };
  }, [play, reduce, value, suffix, delay]);

  const text = `${value}${suffix}`;
  return (
    <>
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
      <span className="hx-sr">{text}</span>
    </>
  );
}

export default function Hero() {
  const ready = useIntroDone();
  const go = useSectionNav();
  const wide = useMedia(WIDE_QUERY);
  const roomy = useMedia(ROOMY_QUERY);
  const [shift, zoom] = framing(wide, roomy);
  const [mood, setMood] = useState(defaultMood);
  const [palette, setPalette] = useState(defaultPalette);
  const [inside, setInside] = useState(false);
  const ids = useId();
  const lightId = `${ids}-light`;
  const paletteId = `${ids}-palette`;

  const appear = (delay, y = 26) => ({
    initial: { opacity: 0, y },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y },
    transition: { duration: 1.1, ease: ease.out, delay },
  });

  return (
    <section className={`hx${inside ? ' is-inside' : ''}`} id="top" aria-label="Introduction">
      <div className="hx-copy-wrap">
        <div className="hx-copy">
          <motion.p className="hx-eyebrow" {...appear(0.05, 16)}>
            <span className="hx-eyebrow-line" aria-hidden="true" />
            Interior design studio
          </motion.p>
          <RevealText
            as="h1"
            className="hx-title"
            lines={['Spaces that', 'breathe *quiet*', 'elegance.']}
            play={ready}
            delay={0.12}
            stagger={0.07}
          />
          <motion.p className="hx-lead" {...appear(0.6)}>
            Anvee Interiors designs homes and workplaces with natural materials, soft light and careful
            craftsmanship. Each space is shaped around the people who use it.
          </motion.p>
          <motion.div className="hx-ctas" {...appear(0.75)}>
            <Link to="/consultation" className="hx-btn hx-btn-primary">
              Book a consultation
              <StrokeIcon d="M5 12h14M13 6l6 6-6 6" size={18} width={1.6} />
            </Link>
            <button type="button" className="hx-btn hx-btn-ghost" onClick={() => go('projects')}>
              Explore projects
            </button>
          </motion.div>
        </div>
      </div>

      <div className="hx-stage">
        <div className="hx-canvas">
          <Room3D
            mood={mood}
            palette={palette}
            view={inside ? 'inside' : 'overview'}
            shift={shift}
            zoom={zoom}
            play={ready}
          />
          {/* Darkens the copy side once the camera steps inside and the room fills the frame. */}
          <span className="hx-scrim" aria-hidden="true" />
          <motion.p
            className="hx-hint"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 1 : 0 }}
            transition={{ duration: 1, ease: ease.out, delay: ready ? 1.6 : 0 }}
          >
            <StrokeIcon d={ICON_ORBIT} size={16} width={1.6} />
            <span className="hx-hint-drag">Drag to explore</span>
            <span className="hx-hint-swipe">Swipe the room</span>
          </motion.p>
        </div>

        <motion.div
          className="hx-dock"
          role="group"
          aria-label="Style the 3D room"
          data-lenis-prevent-horizontal
          {...appear(1.05, 20)}
        >
          <div className="hx-dock-group hx-dock-light" role="group" aria-labelledby={lightId}>
            <span className="hx-dock-label" id={lightId}>
              Light
            </span>
            {moods.map((m) => (
              <button
                key={m.id}
                type="button"
                className="hx-mood"
                aria-pressed={m.id === mood}
                onClick={() => setMood(m.id)}
              >
                <StrokeIcon d={m.icon} />
                {m.label}
              </button>
            ))}
          </div>
          <span className="hx-dock-rule" aria-hidden="true" />
          <div className="hx-dock-group hx-dock-palette" role="group" aria-labelledby={paletteId}>
            <span className="hx-dock-label" id={paletteId}>
              Palette
            </span>
            {palettes.map((p) => (
              <button
                key={p.id}
                type="button"
                className="hx-swatch"
                aria-label={p.label}
                aria-pressed={p.id === palette}
                title={p.label}
                onClick={() => setPalette(p.id)}
              >
                <span className="hx-swatch-dot" style={{ '--hx-swatch': p.swatch }} />
              </button>
            ))}
          </div>
          {/* The label itself says what the button does next, so no aria-pressed here. */}
          <button
            type="button"
            className={`hx-view${inside ? ' is-inside' : ''}`}
            onClick={() => setInside((v) => !v)}
          >
            <StrokeIcon d={inside ? ICON_OVERVIEW : ICON_INSIDE} />
            {inside ? 'Back to overview' : 'Step inside'}
          </button>
        </motion.div>
      </div>

      <dl className="hx-stats">
        {stats.map((s, i) => (
          <motion.div className="hx-stat" key={s.label} {...appear(0.9 + i * 0.08, 18)}>
            <dt>{s.label}</dt>
            <dd>
              <StatValue value={s.value} suffix={s.suffix} play={ready} delay={0.9 + i * 0.08} />
            </dd>
          </motion.div>
        ))}
      </dl>
    </section>
  );
}
