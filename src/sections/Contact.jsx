import { useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import RevealText from '../components/RevealText';
import { studio } from '../data/site';
import { ease } from '../lib/motion';
import '../styles/contact.css';

const kinds = ['Residential', 'Commercial', 'Hospitality', 'Turnkey'];

/** "+91 9227029055" -> "+91 92270 29055" for display. */
const prettyPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91')
    ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
    : phone;
};
const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const fields = [
  { id: 'ct-name', name: 'name', label: 'Your name', type: 'text', autoComplete: 'name', placeholder: 'Full name', required: true },
  { id: 'ct-email', name: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@example.com', required: true },
];

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 1, ease: ease.out, delay },
});

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z" />
    </svg>
  );
}

/**
 * Contact (home, section#contact). Design: Main.dc.html "contact".
 * Submitting opens WhatsApp with the enquiry pre-filled for the visitor to send.
 */
export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [kind, setKind] = useState('Residential');
  const [sent, setSent] = useState(false);

  // Slow drift on the arch outlines (motion values, no re-renders).
  const sectionRef = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const archOuterY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [70, -50]);
  const archInnerY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [120, -20]);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const body = `Hello ${studio.owner}, I'd like to enquire about a ${kind.toLowerCase()} project.\n\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nProject type: ${kind}\n\n${form.message}`;
    window.open(`${studio.whatsapp}?text=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  const phones = [studio.phone, studio.secondaryPhone].filter(Boolean);

  return (
    <section className="ct" id="contact" aria-labelledby="ct-title" ref={sectionRef}>
      <motion.span className="ct-arch ct-arch-outer" aria-hidden="true" style={{ y: archOuterY }} />
      <motion.span className="ct-arch ct-arch-inner" aria-hidden="true" style={{ y: archInnerY }} />

      <div className="ct-inner">
        <div className="ct-copy">
          <div className="section-label">
            <span>(06)</span> Begin your space
          </div>
          <div id="ct-title">
            <RevealText lines={['Let’s create something *timeless*']} className="ct-title" />
          </div>
          <motion.p className="ct-intro" {...rise(0.25)}>
            Share a few details about your space and we will set up a first conversation and a site visit.
          </motion.p>

          <motion.dl className="ct-details" {...rise(0.4)}>
            <div className="ct-row">
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${studio.email}`}>{studio.email}</a>
              </dd>
            </div>
            <div className="ct-row">
              <dt>Phone</dt>
              <dd className="ct-phones">
                {phones.map((p) => (
                  <a key={p} href={telHref(p)} aria-label={`Call ${prettyPhone(p)}`}>
                    {prettyPhone(p)}
                  </a>
                ))}
              </dd>
            </div>
            <div className="ct-row">
              <dt>Owner</dt>
              <dd className="ct-owner">{studio.owner}</dd>
            </div>
          </motion.dl>
        </div>

        <motion.form className="ct-form" aria-label="Project enquiry" onSubmit={submit} {...rise(0.1)}>
          <p className="ct-form-label" id="ct-kind-label">I’m interested in</p>
          <div className="ct-chips" role="group" aria-labelledby="ct-kind-label">
            {kinds.map((k) => {
              const on = kind === k;
              return (
                <button
                  type="button"
                  key={k}
                  className={`ct-chip${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  onClick={() => setKind(k)}
                >
                  {on && (
                    <motion.span
                      layoutId="ct-chip-fill"
                      className="ct-chip-fill"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span className="ct-chip-text">{k}</span>
                </button>
              );
            })}
          </div>

          <div className="ct-field-row">
            {fields.map((f) => (
              <div className="ct-field" key={f.id}>
                <label htmlFor={f.id}>{f.label}</label>
                <input
                  id={f.id}
                  name={f.name}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  required={f.required}
                  value={form[f.name]}
                  onChange={update}
                />
              </div>
            ))}
          </div>
          <div className="ct-field">
            <label htmlFor="ct-phone">Phone</label>
            <input
              id="ct-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91"
              value={form.phone}
              onChange={update}
            />
          </div>
          <div className="ct-field">
            <label htmlFor="ct-message">Tell us about your space</label>
            <textarea
              id="ct-message"
              name="message"
              rows={3}
              placeholder="Rooms, size, timeline, the feeling you want"
              value={form.message}
              onChange={update}
            />
          </div>

          <div className="ct-foot">
            <button type="submit" className="ct-submit" data-cursor="Send">
              <WhatsAppIcon />
              <span>Enquire on WhatsApp</span>
            </button>
            <div className="ct-note" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={sent ? 'sent' : 'hint'}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: ease.out }}
                >
                  {sent
                    ? 'WhatsApp should open with your enquiry ready. Tap Send there to send it.'
                    : `Opens WhatsApp with your ${kind.toLowerCase()} enquiry ready to send.`}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
