import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Magnetic from './Magnetic';
import { ArrowUpRight } from './Icons';
import { useLenis, scrollToTarget } from '../lib/lenis';
import useSectionNav from '../lib/useSectionNav';
import { studio } from '../data/site';
import { categories } from '../data/projects';
import { ease } from '../lib/motion';

export default function Footer() {
  const lenis = useLenis();
  const go = useSectionNav();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-col footer-intro">
            <p className="eyebrow">Anvee Interiors</p>
            <p className="footer-tagline">
              Interiors with a quiet sense of luxury, designed around the people who use them.
            </p>
          </div>
          <div className="footer-col">
            <p className="footer-head">Explore</p>
            <button onClick={() => go('studio')}>Studio</button>
            {Object.values(categories).map((category) => (
              <Link key={category.key} to={`/projects/${category.key}`}>{category.title}</Link>
            ))}
            <button onClick={() => go('services')}>Services</button>
          </div>
          <div className="footer-col">
            <p className="footer-head">Say hello</p>
            <div className="owner-signature">
              <span className="owner-label">Owner</span>
              <span className="owner-name">{studio.owner}</span>
            </div>
            <a href={`mailto:${studio.email}`}>{studio.email}</a>
            <a href={studio.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp: {studio.phone}</a>
            <a href={`tel:${studio.secondaryPhone.replace(/\s/g, '')}`}>Secondary phone: {studio.secondaryPhone}</a>
            <div className="footer-socials">
              {studio.socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                  {s.label} <ArrowUpRight size={12} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className="footer-word"
          aria-hidden="true"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {'ANVEE'.split('').map((l, i) => (
            <span className="reveal-mask" key={i}>
              <motion.span
                variants={{
                  hidden: { y: '100%' },
                  show: { y: '0%', transition: { duration: 1.2, ease: ease.out, delay: i * 0.07 } },
                }}
              >
                {l}
              </motion.span>
            </span>
          ))}
        </motion.div>

        <p className="footer-byline"><span>by</span> {studio.owner}</p>

        <div className="footer-bottom">
          <span>© {year} Anvee Interiors. All rights reserved.</span>
          <Magnetic strength={0.3}>
            <button className="to-top" onClick={() => scrollToTarget(lenis, 'top', { duration: 2 })}>
              Back to top ↑
            </button>
          </Magnetic>
        </div>
      </div>
    </footer>
  );
}
