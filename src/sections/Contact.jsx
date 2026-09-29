import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RevealText from '../components/RevealText';
import Magnetic from '../components/Magnetic';
import { ArrowRight } from '../components/Icons';
import { studio } from '../data/site';
import { ease } from '../lib/motion';

const types = ['Residential', 'Commercial', 'Hospitality', 'Other'];

function Field({ label, name, type = 'text', as = 'input', value, onChange, required }) {
  const Tag = as;
  return (
    <label className={`field${value ? ' has-value' : ''}`}>
      <Tag name={name} type={type} value={value} onChange={onChange} required={required} rows={as === 'textarea' ? 3 : undefined} placeholder=" " />
      <span className="field-label">{label}</span>
      <span className="field-line" />
    </label>
  );
}

/**
 * Opens WhatsApp with the enquiry pre-filled for the visitor to send.
 */
export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [kind, setKind] = useState('Residential');
  const [sent, setSent] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const body = `Hello ${studio.owner}, I'd like to enquire about a ${kind.toLowerCase()} project.\n\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nProject type: ${kind}\n\n${form.message}`;
    window.open(`${studio.whatsapp}?text=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  return (
    <section className="section contact dark" id="contact">
      <div className="container contact-grid">
        <div className="contact-copy">
          <div className="section-label">
            <span>(06)</span> Contact
          </div>
          <RevealText lines={['Let’s create', 'something', '*timeless*']} className="section-title contact-title" />
          <motion.div
            className="contact-details"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: ease.out, delay: 0.3 }}
          >
            <div className="owner-signature">
              <span className="owner-label">Owner</span>
              <span className="owner-name">{studio.owner}</span>
            </div>
            <a href={`mailto:${studio.email}`}>{studio.email}</a>
            <a href={studio.whatsapp} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${studio.owner} at ${studio.phone}`}>{studio.phone}</a>
            <a href={`tel:${studio.secondaryPhone.replace(/\s/g, '')}`} aria-label={`Call our secondary number at ${studio.secondaryPhone}`}>{studio.secondaryPhone}</a>
          </motion.div>
          <Magnetic className="contact-whatsapp">
            <a href={studio.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-light">
              <span>Chat on WhatsApp</span>
              <ArrowRight />
            </a>
          </Magnetic>
        </div>

        <motion.form
          className="contact-form"
          onSubmit={submit}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.1, ease: ease.out }}
        >
          <p className="form-label">I’m interested in</p>
          <div className="chips">
            {types.map((t) => (
              <button type="button" key={t} className={`chip${kind === t ? ' is-active' : ''}`} onClick={() => setKind(t)}>
                {kind === t && <motion.span layoutId="chip-bg" className="chip-bg" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span>{t}</span>
              </button>
            ))}
          </div>

          <div className="field-row">
            <Field label="Your name" name="name" value={form.name} onChange={update} required />
            <Field label="Email" name="email" type="email" value={form.email} onChange={update} required />
          </div>
          <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={update} />
          <Field label="Tell us about your space" name="message" as="textarea" value={form.message} onChange={update} />

          <div className="form-foot">
            <Magnetic>
              <button type="submit" className="btn btn-light">
                <span>Enquire on WhatsApp</span>
                <ArrowRight />
              </button>
            </Magnetic>
            <AnimatePresence>
              {sent && (
                <motion.p
                  className="form-note"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  WhatsApp should open with your enquiry ready. Tap Send there to send it.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
