import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'framer-motion';
import RevealText from '../components/RevealText';
import SmartImage from '../components/SmartImage';
import { useIntroDone } from '../lib/intro';
import { ArrowLeft, ArrowRight, ArrowUpRight } from '../components/Icons';
import { categories, projects, getProjectsByCategory } from '../data/projects';
import { pad } from '../lib/motion';
import '../styles/coverflow.css';

const catKeys = Object.keys(categories);
const chips = [
  { key: 'all', label: 'All', count: projects.length },
  ...catKeys.map((key) => ({
    key,
    label: categories[key].title,
    count: getProjectsByCategory(key).length,
  })),
];

// Covers a chip tap can bring on stage; warmed once the section has been reached.
const warm = new Set(catKeys.flatMap((key) => getProjectsByCategory(key).slice(0, 4).map((p) => p.slug)));

const VISIBLE = 3; // cards beyond +-3 of the active one are hidden
const SWIPE = 40; // px of horizontal travel that counts as a swipe
const SLOP = 8; // px before a gesture is classified as horizontal or vertical
const ENTER_MS = 1700; // first fan-out (transition + longest stagger)

const projectUrl = (p) => `/projects/${p.category}/${p.slug}`;
const metaLine = (p) => [p.type, p.location].filter(Boolean).join(' · ');
const isPlainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** Position of one card relative to the active card (design: Main.dc.html work section). */
function cardStyle(off, inList, entered) {
  const a = Math.abs(off);
  const shown = inList && a <= VISIBLE;
  if (!entered || !inList) {
    // Stacked behind the centre: the resting pose before the fan-out, and
    // where filtered-out cards fold away to.
    return {
      transform: 'translate(-50%, -50%) translateZ(-640px)',
      opacity: 0,
      zIndex: 1,
      pointerEvents: 'none',
      visibility: entered && !inList ? 'hidden' : undefined,
      transitionDelay: entered ? undefined : '0s',
    };
  }
  const sign = off === 0 ? 0 : off > 0 ? 1 : -1;
  const f = Math.min(a, VISIBLE);
  return {
    transform: `translate(-50%, -50%) translateX(${off * 64}%) translateZ(${-a * 230}px) rotateY(${sign * Math.min(a, 1) * 40}deg)`,
    opacity: shown ? 1 - a * 0.14 : 0,
    zIndex: 50 - a,
    filter: `brightness(${(1 - f * 0.1).toFixed(2)}) saturate(${(1 - f * 0.12).toFixed(2)})`,
    visibility: shown ? 'visible' : 'hidden',
    pointerEvents: shown ? 'auto' : 'none',
  };
}

export default function Portfolio() {
  const [cat, setCat] = useState('all');
  const [active, setActive] = useState(0);
  const [settled, setSettled] = useState(false);

  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const cardRefs = useRef(new Map());
  const drag = useRef(null);
  const dragFrame = useRef(0);
  const swallowUntil = useRef(0);

  const inView = useInView(stageRef, { once: true, amount: 0.3 });
  // Covers start downloading once the opening loader has lifted and the
  // section is approaching, so they don't compete with the hero's 3D room;
  // until then each card shows its sand-coloured placeholder.
  const introDone = useIntroDone();
  const approaching = useInView(stageRef, { once: true, margin: '600px 0px' });
  const near = introDone && approaching;

  const list = cat === 'all' ? projects : getProjectsByCategory(cat);
  const n = list.length;
  const index = Math.min(active, n - 1);
  const current = list[index];

  // Fan-out delays apply to the first reveal only; afterwards moves are instant to respond.
  useEffect(() => {
    if (!inView) return undefined;
    const id = setTimeout(() => setSettled(true), ENTER_MS);
    return () => clearTimeout(id);
  }, [inView]);

  const step = useCallback(
    (dir) => setActive((i) => (((Math.min(i, n - 1) + dir) % n) + n) % n),
    [n],
  );

  // Roving focus: if a card had focus (keys, wheel or swipe), follow the card that comes forward.
  useEffect(() => {
    const focused = document.activeElement;
    if (!focused?.classList.contains('cf-card') || !stageRef.current?.contains(focused)) return;
    cardRefs.current.get(current.slug)?.focus({ preventScroll: true });
  }, [current.slug]);

  // Horizontal trackpad swipes over the stage flick through cards.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    let acc = 0;
    let lockUntil = 0;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = e.timeStamp;
      if (now < lockUntil) return;
      acc += e.deltaX;
      if (Math.abs(acc) < 40) return;
      step(acc > 0 ? 1 : -1);
      acc = 0;
      lockUntil = now + 520;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [step]);

  useEffect(() => () => cancelAnimationFrame(dragFrame.current), []);

  const pickCategory = (key) => {
    setCat(key);
    setActive(0);
  };

  const onKeyDown = (e) => {
    const moves = { ArrowRight: 1, ArrowLeft: -1 };
    if (e.key in moves) {
      e.preventDefault();
      step(moves[e.key]);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setActive(e.key === 'Home' ? 0 : n - 1);
    }
  };

  /* ---- swipe (pointer events; vertical page scroll stays native via touch-action: pan-y) ---- */
  const paintDrag = (dx) => {
    cancelAnimationFrame(dragFrame.current);
    dragFrame.current = requestAnimationFrame(() => {
      if (layerRef.current) layerRef.current.style.transform = dx ? `translate3d(${dx}px, 0, 0)` : '';
    });
  };

  const endDrag = (e, cancelled) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    stageRef.current?.classList.remove('is-dragging');
    paintDrag(0);
    if (d.axis !== 'x') return;
    swallowUntil.current = e.timeStamp + 400; // the click that ends a drag must not open a card
    if (cancelled || Math.abs(d.dx) < SWIPE) return;
    const count = Math.min(3, 1 + Math.floor((Math.abs(d.dx) - SWIPE) / 200));
    step(d.dx < 0 ? count : -count);
  };

  const stageHandlers = {
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, axis: null };
    },
    onPointerMove: (e) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.axis) {
        if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
        d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (d.axis === 'y') {
          drag.current = null;
          return;
        }
        e.currentTarget.setPointerCapture?.(e.pointerId);
        e.currentTarget.classList.add('is-dragging');
      }
      d.dx = dx;
      paintDrag(dx * 0.35);
    },
    onPointerUp: (e) => endDrag(e, false),
    onPointerCancel: (e) => endDrag(e, true),
    onClickCapture: (e) => {
      if (e.timeStamp > swallowUntil.current) return;
      swallowUntil.current = 0;
      e.preventDefault();
      e.stopPropagation();
    },
    onDragStart: (e) => e.preventDefault(),
  };

  const catTitle = (key) => categories[key]?.title ?? '';

  return (
    <section className="cf" id="projects" aria-label="Selected work">
      <div className="container">
        <div className="cf-head">
          <div className="cf-heading">
            <div className="section-label">
              <span>(01)</span> Selected work
            </div>
            <RevealText lines={['Rooms with a', '*point* *of* *view*']} className="section-title cf-title" />
          </div>

          <div className="cf-chips" role="group" aria-label="Filter projects by category">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                className="cf-chip"
                data-cat={c.key}
                aria-pressed={cat === c.key}
                onClick={() => pickCategory(c.key)}
              >
                {c.label}
                <span className="cf-chip-count">{c.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          ref={stageRef}
          className="cf-stage"
          role="group"
          aria-roledescription="carousel"
          aria-label="Projects. Use the left and right arrow keys to browse."
          data-cursor="Drag"
          onKeyDown={onKeyDown}
          {...stageHandlers}
        >
          <div className="cf-floor" aria-hidden="true" />
          <div ref={layerRef} className="cf-layer">
            {projects.map((p) => {
              const i = list.indexOf(p);
              const inList = i !== -1;
              const off = inList ? i - index : 0;
              const isActive = inList && off === 0;
              const shown = inList && Math.abs(off) <= VISIBLE;
              const style = cardStyle(off, inList, inView);
              if (inView && !settled && inList) style.transitionDelay = `${0.12 + Math.abs(off) * 0.09}s`;
              return (
                <Link
                  key={p.slug}
                  ref={(el) => {
                    if (el) cardRefs.current.set(p.slug, el);
                    else cardRefs.current.delete(p.slug);
                  }}
                  to={projectUrl(p)}
                  className={`cf-card${isActive ? ' is-active' : ''}`}
                  style={style}
                  draggable={false}
                  tabIndex={isActive ? 0 : -1}
                  aria-hidden={shown ? undefined : true}
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={isActive ? `Open project: ${p.title}, ${p.type}` : `Show ${p.title}, ${p.type}`}
                  data-cursor={isActive ? 'Open' : 'View'}
                  onClick={(e) => {
                    if (isActive || !inList || !isPlainClick(e)) return;
                    e.preventDefault();
                    setActive(i);
                  }}
                >
                  {near && (
                    <SmartImage src={p.cover} alt="" width={1000} eager={shown || (settled && warm.has(p.slug))} />
                  )}
                  <span className="cf-cap" aria-hidden="true">
                    <span className="cf-cap-cat">{catTitle(p.category)}</span>
                    <span className="cf-cap-title">{p.title}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <p className="cf-hint" aria-hidden="true">
          <ArrowLeft size={14} /> Swipe to browse <ArrowRight size={14} />
        </p>

        <div className="cf-details">
          <div className="cf-info" aria-live="polite">
            <p className="cf-counter">
              {pad(index + 1)} / {pad(n)} · {catTitle(current.category)}
            </p>
            <h3 className="cf-name">{current.title}</h3>
            <p className="cf-meta">{metaLine(current)}</p>
            <p className="cf-desc">{current.description}</p>
          </div>

          <div className="cf-actions">
            <button type="button" className="cf-round cf-prev" aria-label="Previous project" onClick={() => step(-1)}>
              <ArrowLeft size={20} />
            </button>
            <button type="button" className="cf-round cf-next" aria-label="Next project" onClick={() => step(1)}>
              <ArrowRight size={20} />
            </button>
            <Link to={projectUrl(current)} className="cf-pill cf-open" data-cursor="Open">
              Open project <ArrowUpRight size={16} />
            </Link>
            {cat !== 'all' && (
              <Link to={`/projects/${cat}`} className="cf-pill cf-all">
                View all {catTitle(cat)} <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
