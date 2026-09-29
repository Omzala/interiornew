import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SmartImage from './SmartImage';
import { ArrowLeft, ArrowRight, Close } from './Icons';
import { useLenis } from '../lib/lenis';
import { ease, pad } from '../lib/motion';

const getViewport = () => ({ w: window.innerWidth, h: window.innerHeight });

/** Where a photo of the given aspect ratio sits when centred on screen. */
function frameFor(aspect, vp) {
  if (vp.w <= 1023) {
    // Leave room for the caption, navigation buttons and thumbnail strip.
    const landscape = vp.w > vp.h && vp.h <= 500;
    const topInset = landscape ? 80 : 120;
    const bottomInset = landscape ? 100 : 172;
    const availableHeight = Math.max(40, vp.h - topInset - bottomInset);
    const width = Math.min(vp.w - 32, availableHeight * aspect);
    const height = width / aspect;
    return { width, height, left: (vp.w - width) / 2, top: topInset + (availableHeight - height) / 2 };
  }

  const maxW = vp.w * 0.8;
  const maxH = vp.h * 0.7;
  const width = Math.min(maxW, maxH * aspect);
  const height = width / aspect;
  return { width, height, left: (vp.w - width) / 2, top: (vp.h - height) / 2 - 36 };
}

/** Transform that makes a frame sit exactly over `rect` (a thumbnail). */
function flipTo(rect, frame) {
  if (!rect) return { opacity: 0, scale: 0.88, x: 0, y: 0 };
  return {
    opacity: 1,
    x: rect.left + rect.width / 2 - (frame.left + frame.width / 2),
    y: rect.top + rect.height / 2 - (frame.top + frame.height / 2),
    scale: rect.width / frame.width,
  };
}

const slide = {
  enter: (dir) => ({ x: dir * 140, opacity: 0, scale: 0.94 }),
  center: { x: 0, y: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir * -140, opacity: 0, scale: 0.94 }),
};

/**
 * Full-screen photo viewer. Opens by lifting the clicked thumbnail into
 * place, supports arrows / keyboard / swipe, and flies back to the grid on
 * close.
 */
export default function Lightbox({ images, startIndex, originRect, aspects, onIndexChange, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [dir, setDir] = useState(0);
  const [navigated, setNavigated] = useState(false);
  const [closing, setClosing] = useState(null);
  const [vp, setVp] = useState(getViewport);
  const thumbsRef = useRef(null);
  const lenis = useLenis();

  const image = images[index];
  const frame = frameFor(aspects[image.src] || image.width / image.height || 1.5, vp);

  const go = useCallback(
    (step) => {
      if (closing) return;
      setDir(step);
      setNavigated(true);
      setIndex((i) => (i + step + images.length) % images.length);
    },
    [closing, images.length]
  );

  const jump = (i) => {
    if (i === index || closing) return;
    setDir(i > index ? 1 : -1);
    setNavigated(true);
    setIndex(i);
  };

  const close = useCallback(() => {
    if (closing) return;
    const thumb = document.querySelector(`[data-photo-index="${index}"]`);
    let rect = thumb?.getBoundingClientRect() ?? null;
    if (rect && (rect.bottom < 0 || rect.top > window.innerHeight)) rect = null;
    setClosing({ rect });
  }, [closing, index]);

  useEffect(() => onIndexChange?.(index), [index, onIndexChange]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Escape') close();
    };
    const onResize = () => setVp(getViewport());
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, [go, close]);

  useEffect(() => {
    lenis?.stop();
    document.body.style.overflow = 'hidden';
    return () => {
      lenis?.start();
      document.body.style.overflow = '';
    };
  }, [lenis]);

  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[index];
    if (thumb) {
      strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2, behavior: 'smooth' });
    }
  }, [index]);

  const chrome = {
    initial: { opacity: 0, y: 16 },
    animate: closing ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: ease.out, delay: closing ? 0 : 0.35 },
  };

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <motion.div
        className="lightbox-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: closing ? 0.7 : 0.6, ease: ease.inOut, delay: closing ? 0.15 : 0 }}
        onClick={close}
      />

      <AnimatePresence custom={dir}>
        <motion.div
          key={index}
          className="lightbox-frame"
          style={{ left: frame.left, top: frame.top, width: frame.width, height: frame.height }}
          custom={dir}
          variants={slide}
          initial={navigated ? 'enter' : flipTo(originRect, frame)}
          animate={closing ? flipTo(closing.rect, frame) : 'center'}
          exit="exit"
          transition={{ duration: closing || !navigated ? 0.9 : 0.75, ease: ease.inOut }}
          onAnimationComplete={() => closing && onClose()}
          drag={closing ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80 || info.velocity.x < -500) go(1);
            else if (info.offset.x > 80 || info.velocity.x > 500) go(-1);
          }}
        >
          {/* Grid-sized copy is already cached, so it shows instantly while the large one loads. */}
          <SmartImage src={image.src} alt="" width={1000} eager />
          <SmartImage className="lightbox-hi" src={image.src} alt={image.caption || 'Project photograph'} width={2000} eager />
        </motion.div>
      </AnimatePresence>

      <motion.div className="lightbox-top" {...chrome}>
        <span className="lightbox-count">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={index}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {pad(index + 1)}
            </motion.span>
          </AnimatePresence>
          <span className="lightbox-total"> / {pad(images.length)}</span>
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={index}
            className="lightbox-caption"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {image.caption}
          </motion.span>
        </AnimatePresence>
        <button className="lightbox-btn" onClick={close} aria-label="Close viewer">
          <Close size={20} />
        </button>
      </motion.div>

      <motion.button className="lightbox-arrow is-prev" onClick={() => go(-1)} aria-label="Previous photo" {...chrome}>
        <ArrowLeft size={22} />
      </motion.button>
      <motion.button className="lightbox-arrow is-next" onClick={() => go(1)} aria-label="Next photo" {...chrome}>
        <ArrowRight size={22} />
      </motion.button>

      <motion.div className="lightbox-thumbs" ref={thumbsRef} data-lenis-prevent {...chrome}>
        {images.map((img, i) => (
          <button
            key={img.src + i}
            className={`lightbox-thumb${i === index ? ' is-active' : ''}`}
            onClick={() => jump(i)}
            aria-label={`Show photo ${i + 1}`}
            aria-current={i === index ? 'true' : undefined}
          >
            <SmartImage src={img.src} alt="" width={200} eager />
            {i === index && <motion.span layoutId="thumb-ring" className="lightbox-thumb-ring" />}
          </button>
        ))}
      </motion.div>
    </div>,
    document.body
  );
}
