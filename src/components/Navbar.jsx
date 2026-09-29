import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Logo from './Logo';
import Magnetic from './Magnetic';
import SmartImage from './SmartImage';
import useSectionNav from '../lib/useSectionNav';
import { useLenis } from '../lib/lenis';
import { categories } from '../data/projects';
import { heroImages, studio } from '../data/site';
import { ease, pad } from '../lib/motion';

const links = [
  { label: 'Home', section: 'top', image: heroImages[0] },
  { label: 'Studio', section: 'studio', image: heroImages[1] },
  ...Object.values(categories).map((category) => ({
    label: category.title, to: `/projects/${category.key}`, image: category.cover,
  })),
  { label: 'Services', section: 'services', image: heroImages[2] },
  { label: 'Contact', section: 'contact', image: heroImages[3] },
];

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(0);
  const { scrollY } = useScroll();
  const go = useSectionNav();
  const lenis = useLenis();
  const location = useLocation();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
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

  return (
    <>
      <motion.header
        className={`nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}
        animate={{ y: hidden && !open ? '-110%' : '0%' }}
        transition={{ duration: 0.6, ease: ease.out }}
      >
        <Link to="/" className="nav-logo" aria-label="Anvee Interiors home" onClick={() => handle({ section: 'top' })}>
          <Logo />
        </Link>

        <nav className="nav-links" aria-label="Primary">
          <button onClick={() => go('studio')}>Studio</button>
          <Link to="/projects/residential">Residential</Link>
          <Link to="/projects/commercial">Commercial</Link>
          <button onClick={() => go('services')}>Services</button>
        </nav>

        <div className="nav-actions">
          <Magnetic strength={0.25}>
            <button className="nav-cta" onClick={() => handle({ section: 'contact' })}>
              <span>Let’s talk</span>
            </button>
          </Magnetic>
          <button
            className={`burger${open ? ' is-open' : ''}`}
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
            className="menu"
            aria-label="Main menu"
            data-lenis-prevent
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            transition={{ duration: 0.9, ease: ease.inOut }}
          >
            <div className="menu-grid">
              <ul className="menu-links">
                {links.map((link, i) => {
                  const inner = (
                    <>
                      <span className="menu-num">{pad(i + 1)}</span>
                      <span className="menu-label">{link.label}</span>
                    </>
                  );
                  return (
                    <li key={link.label} className="reveal-mask" onMouseEnter={() => setHovered(i)}>
                      <motion.div
                        initial={{ y: '110%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '110%' }}
                        transition={{ duration: 0.9, ease: ease.out, delay: 0.25 + i * 0.06 }}
                      >
                        {link.to ? (
                          <Link to={link.to} className={hovered === i ? 'is-active' : ''} onClick={() => setOpen(false)}>
                            {inner}
                          </Link>
                        ) : (
                          <button className={hovered === i ? 'is-active' : ''} onClick={() => handle(link)}>
                            {inner}
                          </button>
                        )}
                      </motion.div>
                    </li>
                  );
                })}
              </ul>

              <motion.div
                className="menu-visual"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: ease.out, delay: 0.4 }}
              >
                <AnimatePresence initial={false}>
                  <motion.div
                    key={hovered}
                    className="menu-visual-img"
                    initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
                    animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                    exit={{ opacity: 0, transition: { delay: 0.5, duration: 0.2 } }}
                    transition={{ duration: 0.8, ease: ease.inOut }}
                  >
                    <SmartImage src={links[hovered].image} alt="" width={900} eager />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            <motion.div
              className="menu-foot"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <a href={`mailto:${studio.email}`}>{studio.email}</a>
              <a href={studio.whatsapp} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${studio.owner} at ${studio.phone}`}>{studio.phone}</a>
              <div className="menu-socials">
                {studio.socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
