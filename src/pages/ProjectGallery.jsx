import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import RevealText from '../components/RevealText';
import ParallaxImage from '../components/ParallaxImage';
import SmartImage from '../components/SmartImage';
import Lightbox from '../components/Lightbox';
import PhotoDeck from '../components/PhotoDeck';
import { ArrowRight, ArrowUpRight } from '../components/Icons';
import { categories, getNextProject, getProject, normalizeImage } from '../data/projects';
import { ease, pad } from '../lib/motion';

function useColumnCount() {
  const get = () => (window.innerWidth >= 1100 ? 3 : window.innerWidth >= 640 ? 2 : 1);
  const [cols, setCols] = useState(get);
  useEffect(() => {
    const onResize = () => setCols(get());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return cols;
}

function Column({ children, progress, shift }) {
  const y = useTransform(progress, [0, 1], [-shift / 2, shift / 2]);
  return (
    <motion.div className="masonry-col" style={{ y }}>
      {children}
    </motion.div>
  );
}

function Photo({ image, index, order, hidden, linked, aspect, onOpen, onAspect }) {
  const delay = (order % 3) * 0.12;
  return (
    <motion.button
      className="photo"
      data-cursor="View"
      data-photo-index={linked ? index : undefined}
      style={{ aspectRatio: aspect || 0.8, opacity: hidden ? 0 : 1 }}
      onClick={(e) => onOpen(index, e.currentTarget.getBoundingClientRect())}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      aria-label={`Open photo ${index + 1}${image.caption ? `: ${image.caption}` : ''}`}
    >
      <motion.span
        className="photo-clip"
        variants={{
          hidden: { clipPath: 'inset(100% 0% 0% 0%)' },
          show: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1.3, ease: ease.inOut, delay } },
        }}
      >
        <motion.span
          className="photo-inner"
          variants={{
            hidden: { scale: 1.35 },
            show: { scale: 1, transition: { duration: 1.8, ease: ease.out, delay } },
          }}
        >
          <SmartImage
            src={image.src}
            alt={image.caption || 'Project photograph'}
            width={1000}
            onLoad={(e) => onAspect(image.src, e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
          />
        </motion.span>
        <span className="photo-caption">
          <span>{pad(index + 1)}</span>
          {image.caption}
        </span>
      </motion.span>
    </motion.button>
  );
}

function Masonry({ images, openIndex, linked, aspects, onOpen, onAspect }) {
  const cols = useColumnCount();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const shifts = cols === 3 ? [0, -140, -50] : cols === 2 ? [0, -90] : [0];

  const columns = Array.from({ length: cols }, () => []);
  images.forEach((img, i) => columns[i % cols].push({ img, i }));

  return (
    <div className="masonry" ref={ref}>
      {columns.map((col, c) => (
        <Column key={c} progress={scrollYProgress} shift={shifts[c]}>
          {col.map(({ img, i }, order) => (
            <Photo
              key={img.src + i}
              image={img}
              index={i}
              order={order + c}
              hidden={openIndex === i}
              linked={linked}
              aspect={aspects[img.src] || img.width / img.height}
              onOpen={onOpen}
              onAspect={onAspect}
            />
          ))}
        </Column>
      ))}
    </div>
  );
}

export default function ProjectGallery() {
  const { category, slug } = useParams();
  const project = getProject(category, slug);
  const [filter, setFilter] = useState('All');
  // { index, rect, from: 'library' | 'deck' } while the viewer is open.
  const [lightbox, setLightbox] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [deckIndex, setDeckIndex] = useState(0);
  const [aspects, setAspects] = useState({});
  const fromDeck = lightbox?.from === 'deck';

  const images = useMemo(() => (project ? project.images.map(normalizeImage) : []), [project]);
  const tags = useMemo(() => ['All', ...new Set(images.map((i) => i.tag).filter(Boolean))], [images]);
  const visible = filter === 'All' ? images : images.filter((i) => i.tag === filter);

  const onAspect = useCallback((src, ratio) => {
    if (!ratio || !isFinite(ratio)) return;
    setAspects((a) => (a[src] ? a : { ...a, [src]: ratio }));
  }, []);

  const onOpen = useCallback((index, rect) => {
    setOpenIndex(index);
    setLightbox({ index, rect, from: 'library' });
  }, []);

  // The deck always shows every photo, whatever the library filter.
  const onDeckOpen = useCallback((index, rect) => {
    setOpenIndex(index);
    setLightbox({ index, rect, from: 'deck' });
  }, []);

  // While the viewer was opened from the deck, the deck follows it so the
  // photo can fly back to the front card on close.
  const onViewerIndex = useCallback(
    (index) => {
      setOpenIndex(index);
      if (fromDeck) setDeckIndex(index);
    },
    [fromDeck]
  );

  const onClose = useCallback(() => {
    setLightbox(null);
    setOpenIndex(null);
  }, []);

  useEffect(() => {
    if (project) document.title = `${project.title} — Anvee Interiors`;
  }, [project]);

  if (!project) return <Navigate to={categories[category] ? `/projects/${category}` : '/'} replace />;

  const next = getNextProject(project);
  const meta = [
    ['Category', categories[category].title],
    ['Type', project.type],
    ['Location', project.location],
    ['Year', project.year],
    ['Area', project.area],
    ['Gallery', `${project.images.length} images`],
  ].filter(([, value]) => value);

  return (
    <PageTransition label={project.title}>
      <section className="gallery-hero">
        <div className="container">
          <motion.div
            className="crumbs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: ease.out, delay: 0.6 }}
          >
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to={`/projects/${category}`}>{categories[category].title}</Link>
            <span>/</span>
            <span className="is-current">{project.title}</span>
          </motion.div>

          <RevealText as="h1" lines={[project.title]} className="gallery-title" delay={0.5} stagger={0.1} play />

          <div className="gallery-meta">
            {meta.map(([k, v], i) => (
              <motion.div
                key={k}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: ease.out, delay: 0.8 + i * 0.08 }}
              >
                <span className="meta-key">{k}</span>
                <span className="meta-val">{v}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="gallery-cover">
        <ParallaxImage src={project.cover} alt={project.title} width={2000} strength={10} eager delay={0.6} />
      </div>

      <section className="section pd-intro" aria-label="The project">
        <div className="container pd-intro-grid">
          <div className="pd-intro-copy">
            <div className="section-label">
              <span>(i)</span> The project
            </div>
            <motion.p
              className="pd-intro-desc"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.1, ease: ease.out }}
            >
              {project.description}
            </motion.p>
            <Link to="/consultation" className="pd-intro-cta">
              Plan a space like this
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="pd-intro-deck">
            <PhotoDeck
              images={images}
              index={deckIndex}
              onIndexChange={setDeckIndex}
              lifted={fromDeck ? openIndex : null}
              onOpen={onDeckOpen}
            />
          </div>
        </div>
      </section>

      <section className="section library">
        <div className="container">
          <div className="library-head">
            <div>
              <div className="section-label">
                <span>(ii)</span> Photo library
              </div>
              <RevealText lines={['The *library*']} className="section-title" />
            </div>
            <div className="library-tools">
              <span className="library-count">
                {pad(visible.length)} <em>photographs</em>
              </span>
              {tags.length > 2 && (
                <div className="filters">
                  {tags.map((t) => (
                    <button key={t} className={`filter${filter === t ? ' is-active' : ''}`} onClick={() => setFilter(t)}>
                      {filter === t && (
                        <motion.span layoutId="filter-pill" className="filter-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                      )}
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: 30, transition: { duration: 0.45, ease: ease.inOut } }}
            >
              <Masonry
                images={visible}
                openIndex={fromDeck ? null : openIndex}
                linked={!fromDeck}
                aspects={aspects}
                onOpen={onOpen}
                onAspect={onAspect}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="next-project">
        <Link to={`/projects/${next.category}/${next.slug}`} className="next-project-link" data-cursor="Next">
          <div className="container next-project-inner">
            <span className="eyebrow">Next project</span>
            <span className="next-project-title">
              {next.title}
              <ArrowUpRight size={48} />
            </span>
          </div>
          <div className="next-project-media">
            <SmartImage src={next.cover} alt="" width={1800} />
          </div>
        </Link>
      </section>

      {lightbox && (
        <Lightbox
          images={fromDeck ? images : visible}
          startIndex={lightbox.index}
          originRect={lightbox.rect}
          aspects={aspects}
          onIndexChange={onViewerIndex}
          onClose={onClose}
        />
      )}
    </PageTransition>
  );
}
