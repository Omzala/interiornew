import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import SmartImage from './SmartImage';
import { ArrowLeft, ArrowRight } from './Icons';
import { pad } from '../lib/motion';
import '../styles/photo-deck.css';

const SWIPE = 40; // px of horizontal travel that counts as a swipe
const SLOP = 8; // px before a press turns into a drag

/**
 * Where the card `o` places behind the front one sits in the stack.
 * The card just before the front one has been thrown off to the left.
 */
function slotFor(o, n) {
  if (o === 0) return 'front';
  if (n >= 3 && o === n - 1) return 'gone';
  return o <= 3 ? String(o) : 'queued';
}

const wrap = (i, n) => ((i % n) + n) % n;

/**
 * A stack of photos as 3D cards (Mobile-Project.dc.html). The front card
 * flies off to the left on "next"; swipe, arrows, thumbnails and the
 * keyboard move through the stack and a tap opens the photo viewer.
 *
 * `index` / `onIndexChange` make it controlled (the gallery keeps it in step
 * with the lightbox). `lifted` is the index currently shown in the lightbox:
 * that card is hidden and tagged with `data-photo-index` so the viewer can
 * fly back to it when it closes.
 */
export default function PhotoDeck({ images, onOpen, index: controlled, onIndexChange, lifted = null, className = '' }) {
  const n = images.length;
  const [own, setOwn] = useState(0);
  const index = n ? wrap(controlled ?? own, n) : 0;

  // Direction of the last move decides whether the card leaving for the
  // "gone" slot passes over the stack (thrown front card) or under it.
  const [track, setTrack] = useState({ index, dir: 1 });
  if (track.index !== index) {
    const forward = wrap(index - track.index, n || 1);
    setTrack({ index, dir: forward <= n / 2 ? 1 : -1 });
  }

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const thumbsRef = useRef(null);
  const drag = useRef(null);
  const frame = useRef(0);
  const swallowUntil = useRef(0);
  const focusFront = useRef(false);
  const inView = useInView(rootRef, { once: true, amount: 0.25 });

  const select = useCallback(
    (i) => {
      if (!n) return;
      const next = wrap(i, n);
      if (controlled === undefined) setOwn(next);
      onIndexChange?.(next);
    },
    [n, controlled, onIndexChange]
  );

  const step = useCallback((d) => select(index + d), [select, index]);

  const frontCard = () => stageRef.current?.querySelector('[data-slot="front"]');

  const paint = () => {
    frame.current = 0;
    const card = frontCard();
    const dx = drag.current?.active ? drag.current.dx : 0;
    if (!card) return;
    card.style.setProperty('--pd-dx', `${dx}px`);
    card.style.setProperty('--pd-rot', `${dx * 0.05}deg`);
  };

  const resetDragPose = () => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    stageRef.current?.classList.remove('is-dragging');
    const card = frontCard();
    card?.style.removeProperty('--pd-dx');
    card?.style.removeProperty('--pd-rot');
  };

  const onPointerDown = (e) => {
    if (n < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, active: false };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.abs(dy) > SLOP && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null; // a vertical scroll, not ours
        return;
      }
      if (Math.abs(dx) < SLOP) return;
      d.active = true;
      stageRef.current?.classList.add('is-dragging');
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
    }
    d.dx = dx;
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  };

  const endDrag = (e, cancelled = false) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const dx = cancelled ? 0 : e.clientX - d.x;
    if (!d.active && Math.abs(dx) <= SWIPE) return;
    // The click that follows a drag must not open the viewer.
    swallowUntil.current = e.timeStamp + 400;
    // Back to the slot pose with transitions on, so the card animates from
    // where the finger left it (to its old slot, or off to the next one).
    resetDragPose();
    if (Math.abs(dx) > SWIPE) step(dx < 0 ? 1 : -1);
  };

  const onKeyDown = (e) => {
    if (lifted != null || n < 2) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    focusFront.current = Boolean(e.target.closest?.('.pd-card'));
    step(e.key === 'ArrowRight' ? 1 : -1);
  };

  const open = (e, i) => {
    // Keyboard clicks (detail 0) always open; pointer clicks right after a drag don't.
    if (e.detail !== 0 && e.timeStamp < swallowUntil.current) return;
    onOpen?.(i, e.currentTarget.getBoundingClientRect());
  };

  // Keyboard users stay on the (new) front card after an arrow key.
  useEffect(() => {
    if (!focusFront.current) return;
    focusFront.current = false;
    stageRef.current?.querySelector('[data-slot="front"]')?.focus({ preventScroll: true });
  }, [index]);

  // Keep the active thumbnail in view when the strip scrolls.
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[index];
    if (!strip || !thumb || strip.scrollWidth <= strip.clientWidth) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.scrollTo({
      left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [index]);

  // When the viewer opened from this deck closes, hand focus back to the
  // front card (the hidden card dropped it while the viewer was open).
  const wasLifted = useRef(false);
  useEffect(() => {
    if (lifted != null) {
      wasLifted.current = true;
      return;
    }
    if (!wasLifted.current) return;
    wasLifted.current = false;
    const active = document.activeElement;
    if (!active || active === document.body) {
      stageRef.current?.querySelector('[data-slot="front"]')?.focus({ preventScroll: true });
    }
  }, [lifted]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  if (!n) return null;

  const current = images[index];
  const many = n > 6;

  return (
    <div
      ref={rootRef}
      className={`pd${inView ? ' is-in' : ''}${track.dir < 0 ? ' is-back' : ''} ${className}`}
      role="group"
      aria-roledescription="carousel"
      aria-label="Project photos"
      onKeyDown={onKeyDown}
    >
      <div
        ref={stageRef}
        className="pd-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e)}
        onPointerCancel={(e) => endDrag(e, true)}
      >
        <span className="pd-glow" aria-hidden="true" />
        {images.map((img, i) => {
          const o = wrap(i - index, n);
          const slot = slotFor(o, n);
          const front = o === 0;
          return (
            <button
              key={img.src + i}
              type="button"
              className={`pd-card${lifted === i ? ' is-lifted' : ''}`}
              data-slot={slot}
              data-cursor={front ? 'View' : undefined}
              data-photo-index={front && lifted != null ? i : undefined}
              style={{ zIndex: slot === 'gone' ? (track.dir < 0 ? 0 : n + 1) : n - o, '--pd-o': Math.min(o, 4) }}
              tabIndex={front ? 0 : -1}
              aria-hidden={front ? undefined : true}
              aria-label={`Open photo ${i + 1} of ${n}${img.caption ? `: ${img.caption}` : ''}`}
              onClick={front ? (e) => open(e, i) : undefined}
            >
              <SmartImage src={img.src} alt="" width={1000} />
              {(img.tag || img.caption) && (
                <span className="pd-cap" aria-hidden="true">
                  {img.tag && <span className="pd-tag">{img.tag}</span>}
                  {img.caption && <span className="pd-cap-text">{img.caption}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="pd-bar">
        <p className="pd-count" aria-live="polite" aria-atomic="true">
          <span className="pd-visually-hidden">Photo </span>
          <span className="pd-count-now">{pad(index + 1)}</span>
          <span className="pd-count-sep" aria-hidden="true"> / </span>
          <span className="pd-visually-hidden"> of </span>
          {pad(n)}
          {current.tag && <span className="pd-count-tag">{current.tag}</span>}
        </p>
        {n > 1 && (
          <div className="pd-nav">
            <button type="button" className="pd-btn" onClick={() => step(-1)} aria-label="Previous photo">
              <ArrowLeft size={18} />
            </button>
            <button type="button" className="pd-btn is-solid" onClick={() => step(1)} aria-label="Next photo">
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      {n > 1 && (
        <div ref={thumbsRef} className={`pd-thumbs${many ? ' is-scroll' : ''}`} data-lenis-prevent-horizontal={many || undefined}>
          {images.map((img, i) => (
            <button
              key={img.src + i}
              type="button"
              className="pd-thumb"
              onClick={() => select(i)}
              aria-label={`Show photo ${i + 1}${img.caption ? `: ${img.caption}` : ''}`}
              aria-pressed={i === index}
            >
              <SmartImage src={img.src} alt="" width={320} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
