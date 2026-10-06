import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { Close } from '../components/Icons';
import { studio } from '../data/site';
import '../styles/consultation.css';

/* Design source: Mobile-Consult.dc.html. The three steps sit on the faces
   of a cube that turns -90deg per step (flat swap with reduced motion). */

const kinds = [
  { id: 'Home', sub: 'Apartments & villas', icon: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6' },
  { id: 'Office', sub: 'Workplaces & classrooms', icon: 'M4 21V5l8-3v19M12 9h8v12M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2M2 21h20' },
  { id: 'Hospitality', sub: 'Cafés, restaurants, hotels', icon: 'M4 18h16M5 18a7 7 0 0 1 14 0M12 8V6M10 6h4' },
  { id: 'Turnkey', sub: 'Design to handover', icon: 'M15 5a4 4 0 1 1 0 8a4 4 0 0 1 0-8zM12.2 11.8L4 20M7 17l2 2M5 19l2 2' },
];
const spaceNames = ['Living', 'Kitchen', 'Bedrooms', 'Dining', 'Study', 'Reception', 'Workstations', 'Meeting rooms', 'Whole home'];
const areas = ['Under 1,000', '1,000–2,000', '2,000+'];
const prefs = ['WhatsApp', 'Phone call'];
const labels = ['Step 1 of 3 · Type of space', 'Step 2 of 3 · Rooms and size', 'Step 3 of 3 · Contact'];
const LAST = 2;

const CHECK = 'M5 12.5l4.5 4.5L19 7.5';
const PLUS = 'M12 5v14M5 12h14';

function Glyph({ d, size = 18, stroke = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function Consultation() {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [area, setArea] = useState('');
  const [pref, setPref] = useState('WhatsApp');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const primaryRef = useRef(null);
  const stageRef = useRef(null);
  const refocus = useRef(false);

  useEffect(() => {
    document.title = 'Book a consultation — Anvee Interiors';
  }, []);

  // After Back/Continue, move focus to the new step's heading so keyboard and
  // screen-reader users continue from the top of that step (the button they
  // pressed may also have unmounted on the first/last step).
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const heading = stageRef.current?.querySelector('.cs-face.is-active .cs-title');
    (heading || primaryRef.current)?.focus({ preventScroll: true });
  }, [step]);

  const canGo = step === 0 ? Boolean(kind) : step === 1 ? spaces.length > 0 : true;

  const goTo = (next) => {
    refocus.current = true;
    setStep(Math.max(0, Math.min(LAST, next)));
  };
  const forward = () => {
    if (canGo) goTo(step + 1);
  };

  const toggleSpace = (nm) =>
    setSpaces((list) => (list.includes(nm) ? list.filter((x) => x !== nm) : [...list, nm]));

  const firstName = studio.owner.split(' ')[0];
  const briefTitle = `${kind || 'Your'} project`;
  const briefLine = `${spaces.length ? spaces.join(', ') : 'Spaces to be decided'}${area ? ` · ${area} sq ft` : ''} · Reply by ${pref === 'WhatsApp' ? pref : pref.toLowerCase()}`;
  const message = [
    `Hello ${firstName}, I would like to book a consultation for a ${(kind || 'new').toLowerCase()} project.`,
    `Spaces: ${spaces.length ? spaces.join(', ') : 'to discuss'}.`,
    `Area: ${area ? `${area} sq ft` : 'to discuss'}.`,
    `Preferred contact: ${pref}.`,
    name.trim() && `Name: ${name.trim()}`,
    phone.trim() && `Phone: ${phone.trim()}`,
  ]
    .filter(Boolean)
    .join('\n');
  const waHref = `${studio.whatsapp}?text=${encodeURIComponent(message)}`;

  const face = (i) => ({
    className: `cs-face${step === i ? ' is-active' : ''}`,
    style: { '--cs-i': i },
    'aria-hidden': step !== i,
    inert: step !== i,
  });
  const tab = (i) => (step === i ? 0 : -1);

  const fwdLabel = canGo ? 'Continue' : step === 0 ? 'Choose a type to continue' : 'Choose a space to continue';

  return (
    <PageTransition label="Book a consultation">
      <section className="cs" aria-labelledby="cs-heading">
        <span className="cs-arch cs-arch-outer" aria-hidden="true" />
        <span className="cs-arch cs-arch-inner" aria-hidden="true" />

        <div className="cs-wrap">
          <div className="cs-top">
            <Link to="/" className="cs-close" aria-label="Close and go back home">
              <Close size={20} />
            </Link>
            <h1 id="cs-heading" className="cs-kicker">Book a consultation</h1>
            <span className="cs-top-spacer" aria-hidden="true" />
          </div>

          <div className="cs-progress">
            <div className="cs-bars" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span className="cs-bar" key={i}>
                  <span className="cs-bar-fill" style={{ '--cs-fill': i < step ? 1 : i === step ? 0.5 : 0 }} />
                </span>
              ))}
            </div>
            <p className="cs-step-label" aria-live="polite">{labels[step]}</p>
          </div>

          <div className="cs-stage" ref={stageRef}>
            <div className="cs-cube" style={{ '--cs-step': step }}>
              {/* Step 1: type of space */}
              <section aria-label="Step 1, type of space" {...face(0)}>
                <h2 className="cs-title" tabIndex={-1}>
                  What are we <em>designing</em>?
                </h2>
                <p className="cs-lede">Pick the closest fit. We will refine the details together.</p>
                <div className="cs-tiles">
                  {kinds.map((k) => {
                    const on = kind === k.id;
                    return (
                      <button
                        type="button"
                        key={k.id}
                        className={`cs-tile${on ? ' is-on' : ''}`}
                        aria-pressed={on}
                        tabIndex={tab(0)}
                        onClick={() => setKind(k.id)}
                      >
                        <Glyph d={k.icon} size={30} stroke={1.3} />
                        <span className="cs-tile-text">
                          <span className="cs-tile-label">{k.id}</span>
                          <span className="cs-tile-sub">{k.sub}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Step 2: rooms and size */}
              <section aria-label="Step 2, rooms and size" {...face(1)}>
                <h2 className="cs-title" tabIndex={-1}>
                  Which <em>spaces</em>?
                </h2>
                <p className="cs-lede">Choose all that apply.</p>
                <div className="cs-chips" role="group" aria-label="Spaces">
                  {spaceNames.map((nm) => {
                    const on = spaces.includes(nm);
                    return (
                      <button
                        type="button"
                        key={nm}
                        className={`cs-chip${on ? ' is-on' : ''}`}
                        aria-pressed={on}
                        tabIndex={tab(1)}
                        onClick={() => toggleSpace(nm)}
                      >
                        <Glyph d={on ? CHECK : PLUS} size={14} stroke={2} />
                        {nm}
                      </button>
                    );
                  })}
                </div>
                <p className="cs-caption" id="cs-area-label">Approximate area (sq ft)</p>
                <div className="cs-seg cs-seg-3" role="group" aria-labelledby="cs-area-label">
                  {areas.map((a) => (
                    <button
                      type="button"
                      key={a}
                      className={`cs-seg-btn${area === a ? ' is-on' : ''}`}
                      aria-pressed={area === a}
                      tabIndex={tab(1)}
                      onClick={() => setArea(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </section>

              {/* Step 3: contact details */}
              <section aria-label="Step 3, contact details" {...face(2)}>
                <h2 className="cs-title" tabIndex={-1}>
                  How do we <em>reach you</em>?
                </h2>
                <div className="cs-field-row">
                  <div className="cs-field">
                    <label htmlFor="cs-name">Your name</label>
                    <input
                      id="cs-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Full name"
                      tabIndex={tab(2)}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="cs-field">
                    <label htmlFor="cs-phone">Phone</label>
                    <input
                      id="cs-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+91"
                      tabIndex={tab(2)}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <p className="cs-caption" id="cs-pref-label">Preferred contact</p>
                <div className="cs-seg cs-seg-2" role="group" aria-labelledby="cs-pref-label">
                  {prefs.map((p) => (
                    <button
                      type="button"
                      key={p}
                      className={`cs-seg-btn${pref === p ? ' is-on' : ''}`}
                      aria-pressed={pref === p}
                      tabIndex={tab(2)}
                      onClick={() => setPref(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="cs-brief-wrap">
                  <div className="cs-brief">
                    <p className="cs-brief-kicker">Your brief</p>
                    <p className="cs-brief-title">{briefTitle}</p>
                    <p className="cs-brief-line">{briefLine}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="cs-actions">
            {step > 0 && (
              <button type="button" className="cs-back" aria-label="Previous step" onClick={() => goTo(step - 1)}>
                <Glyph d="M19 12H5M11 6l-6 6 6 6" />
              </button>
            )}
            {step === LAST ? (
              <a
                ref={primaryRef}
                key="send"
                className="cs-primary"
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Glyph d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z" />
                Send on WhatsApp
              </a>
            ) : (
              <button
                ref={primaryRef}
                key="next"
                type="button"
                className={`cs-primary${canGo ? '' : ' is-waiting'}`}
                aria-disabled={!canGo}
                onClick={forward}
              >
                {fwdLabel}
                <Glyph d="M5 12h14M13 6l6 6-6 6" size={16} />
              </button>
            )}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
