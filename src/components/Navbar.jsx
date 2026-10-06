import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { LogoMark } from './Logo';
import Magnetic from './Magnetic';
import SmartImage from './SmartImage';
import useSectionNav from '../lib/useSectionNav';
import { useLenis } from '../lib/lenis';
import { categories } from '../data/projects';
import { heroImages, services, studio } from '../data/site';
import { ease, pad } from '../lib/motion';
import '../styles/navbar.css';

/* Top bar (Main.dc.html): home sections, scrolled to from any page. */
const barLinks = [
  { label: 'Work', section: 'projects' },
  { label: 'Services', section: 'services' },
  { label: 'Process', section: 'process' },
  { label: 'Studio', section: 'studio' },
  { label: 'Contact', section: 'contact' },
];

/* Full-screen menu: sections plus every project category, each with a preview photo. */
const menuLinks = [
  { label: 'Home', section: 'top', image: heroImages[0] },
  { label: 'Studio', section: 'studio', image: heroImages[1] },
  ...Object.values(categories).map((category) => ({
    label: category.title, to: `/projects/${category.key}`, image: category.cover,
  })),
  { label: 'Services', section: 'services', image: services[0].image },
  { label: 'Contact', section: 'contact', image: heroImages[3] },
];

const CONSULT = '/consultation';
const tel = `tel:${studio.phone.replace(/\s/g, '')}`;

const Arrow = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const icons = {
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  chat: 'M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
};

const Glyph = ({ d }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const contacts = [
  { key: 'call', short: 'Call', long: studio.phone, href: tel, icon: icons.phone, label: `Call ${studio.owner} at ${studio.phone}` },
  { key: 'wa', short: 'WhatsApp', long: 'WhatsApp', href: studio.whatsapp, icon: icons.chat, label: `WhatsApp ${studio.owner} at ${studio.phone}`, external: true },
  { key: 'mail', short: 'Email', long: studio.email, href: `mailto:${studio.email}`, icon: icons.mail, label: `Email ${studio.email}` },
];

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(0);
  const [barHover, setBarHover] = useState(null);
  const { scrollY } = useScroll();
  const go = useSectionNav();
  const lenis = useLenis();
  const location = useLocation();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 200);
  });

  // Close the menu whenever the route changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI with navigation
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    lenis?.stop();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      lenis?.start();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, lenis]);

  const handle = (link) => {
    setOpen(false);
    // Let the menu start closing (and scrolling resume) before moving the page.
    if (link.section) setTimeout(() => go(link.section), 80);
  };

  const onConsult = location.pathname === CONSULT;

  return (
    <>
      <motion.header
        className={`nvb${open ? ' is-open' : ''}`}
        initial={false}
        animate={{ y: hidden && !open ? -140 : 0 }}
        transition={{ duration: 0.6, ease: ease.out }}
      >
        <Link to="/" className="nvb-logo" aria-label="Anvee Interiors home" onClick={() => handle({ section: 'top' })}>
          <LogoMark size={24} />
          <span className="nvb-word" aria-hidden="true">
            <span className="nvb-name">ANVEE</span>
            <span className="nvb-sub">Interiors</span>
          </span>
        </Link>

        <nav className="nvb-links" aria-label="Primary" onMouseLeave={() => setBarHover(null)}>
          {barLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              className="nvb-link"
              onClick={() => go(link.section)}
              onMouseEnter={() => setBarHover(link.label)}
              onFocus={() => setBarHover(link.label)}
              onBlur={() => setBarHover(null)}
            >
              {barHover === link.label && (
                <motion.span
                  layoutId="nvb-link-pill"
                  className="nvb-link-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <span className="nvb-link-text">{link.label}</span>
            </button>
          ))}
        </nav>

        <div className="nvb-actions">
          <Magnetic strength={0.2} className="nvb-cta-wrap">
            <Link
              to={CONSULT}
              className="nvb-cta"
              aria-current={onConsult ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              Book a consultation
              <Arrow />
            </Link>
          </Magnetic>
          <button
            type="button"
            className={`nvb-burger${open ? ' is-open' : ''}`}
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="site-menu"
          >
            <span />
            <span />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="site-menu"
            className="nvm"
            aria-label="Main menu"
            data-lenis-prevent
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            transition={{ duration: 0.9, ease: ease.inOut }}
          >
            <span className="nvm-arch" aria-hidden="true" />
            <span className="nvm-arch is-inner" aria-hidden="true" />

            <div className="nvm-grid">
              <div className="nvm-main">
                <ul className="nvm-links">
                  {menuLinks.map((link, i) => {
                    const pick = () => setHovered(i);
                    const props = {
                      className: `nvm-link${hovered === i ? ' is-active' : ''}`,
                      onMouseEnter: pick,
                      onFocus: pick,
                      onTouchStart: pick,
                    };
                    const inner = (
                      <>
                        <span className="nvm-num">{pad(i + 1)}</span>
                        <span className="nvm-label">{link.label}</span>
                        <span className="nvm-thumb" aria-hidden="true">
                          <SmartImage src={link.image} alt="" width={320} eager />
                        </span>
                      </>
                    );
                    return (
                      <li key={link.label}>
                        <motion.div
                          className="nvm-row"
                          style={{ transformPerspective: 800 }}
                          initial={{ opacity: 0, y: 26, rotateX: -35 }}
                          animate={{ opacity: 1, y: 0, rotateX: 0 }}
                          exit={{ opacity: 0, y: 12, transition: { duration: 0.3 } }}
                          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1], delay: 0.3 + i * 0.06 }}
                        >
                          {link.to ? (
                            <Link to={link.to} {...props} onClick={() => setOpen(false)}>
                              {inner}
                            </Link>
                          ) : (
                            <button type="button" {...props} onClick={() => handle(link)}>
                              {inner}
                            </button>
                          )}
                        </motion.div>
                      </li>
                    );
                  })}
                </ul>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: ease.out, delay: 0.3 + menuLinks.length * 0.06 }}
                >
                  <Link
                    to={CONSULT}
                    className="nvm-book"
                    aria-current={onConsult ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    Book a consultation
                    <Arrow size={18} />
                  </Link>
                </motion.div>
              </div>

              <motion.div
                className="nvm-visual"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: ease.out, delay: 0.4 }}
              >
                <AnimatePresence initial={false}>
                  <motion.div
                    key={hovered}
                    className="nvm-visual-img"
                    initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
                    animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                    exit={{ opacity: 0, transition: { delay: 0.5, duration: 0.2 } }}
                    transition={{ duration: 0.8, ease: ease.inOut }}
                  >
                    <SmartImage src={menuLinks[hovered].image} alt="" width={900} eager />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            <motion.div
              className="nvm-foot"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="nvm-contact">
                {contacts.map((c) => (
                  <a
                    key={c.key}
                    className="nvm-tile"
                    href={c.href}
                    aria-label={c.label}
                    {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <Glyph d={c.icon} />
                    <span className="nvm-tile-short">{c.short}</span>
                    <span className="nvm-tile-long">{c.long}</span>
                  </a>
                ))}
              </div>
              <div className="nvm-socials">
                {studio.socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                ))}
              </div>
              <p className="nvm-owner">{studio.owner}</p>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
