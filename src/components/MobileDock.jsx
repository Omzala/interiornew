import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useIntroDone } from '../lib/intro';
import { studio } from '../data/site';
import '../styles/mobile-dock.css';

const FIELD = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"]), textarea, select, [contenteditable="true"]';
const isField = (el) => el instanceof Element && el.matches(FIELD);

/**
 * Phone-only quick-action bar (<= 760px; hidden by CSS above that).
 * Design: Mobile.dc.html "Quick actions" glass pill.
 * Slides away while the intro loader runs, while the full-screen menu is
 * open, while a text field is focused (on-screen keyboard), and on the
 * consultation page, which has its own action bar.
 */
export default function MobileDock() {
  const { pathname } = useLocation();
  const introDone = useIntroDone();
  const [menuOpen, setMenuOpen] = useState(false);
  // Path where a text field took focus; a route change clears it even if
  // the focused field unmounts without firing focusout.
  const [typingAt, setTypingAt] = useState(null);
  const typing = typingAt === pathname;

  const onConsult = pathname === '/consultation';
  const away = !introDone || onConsult || menuOpen || typing;

  // The Navbar burger mirrors the menu state in aria-expanded; watch only
  // that attribute inside the header (cheap, no body-wide observer).
  useEffect(() => {
    const burger = document.querySelector('[aria-controls="site-menu"]');
    const root = burger?.closest('header') ?? burger?.parentElement;
    if (!root) return undefined;
    const sync = () =>
      setMenuOpen(Boolean(root.querySelector('[aria-controls="site-menu"][aria-expanded="true"]')));
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, subtree: true, attributeFilter: ['aria-expanded'] });
    return () => observer.disconnect();
  }, []);

  // Keep the keyboard's input visible: step aside while typing.
  useEffect(() => {
    const onFocusIn = (e) => {
      setTypingAt(isField(e.target) ? window.location.pathname : null);
    };
    const onFocusOut = (e) => {
      if (isField(e.target) && !isField(e.relatedTarget)) setTypingAt(null);
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  // Lets mobile-dock.css reserve room under the footer only when the dock exists.
  useEffect(() => {
    if (onConsult) return undefined;
    const root = document.documentElement;
    root.classList.add('has-mdock');
    return () => root.classList.remove('has-mdock');
  }, [onConsult]);

  return (
    <nav className={`mdock${away ? ' is-away' : ''}`} aria-label="Quick actions" aria-hidden={away || undefined} inert={away}>
      <Link to="/consultation" className="mdock-book">
        <span>Book a consultation</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
      <a
        className="mdock-round"
        href={studio.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z" />
        </svg>
      </a>
      <a className="mdock-round" href={`tel:${studio.phone.replace(/\s/g, '')}`} aria-label="Call the studio">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
        </svg>
      </a>
    </nav>
  );
}
