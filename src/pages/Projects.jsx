import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import RevealText from '../components/RevealText';
import ProjectCard from '../components/ProjectCard';
import SmartImage from '../components/SmartImage';
import { categories, getProjectsByCategory } from '../data/projects';
import { ease, pad } from '../lib/motion';

export default function Projects() {
  const { category } = useParams();
  const cat = categories[category];

  useEffect(() => {
    if (cat) document.title = `${cat.title} Projects — Anvee Interiors`;
  }, [cat]);

  if (!cat) return <Navigate to="/projects/residential" replace />;

  const list = getProjectsByCategory(category);
  const keys = Object.keys(categories);
  const other = keys[(keys.indexOf(category) + 1) % keys.length];

  return (
    <PageTransition label={cat.title}>
      <section className="plist-hero">
        <div className="container">
          <motion.div
            className="crumbs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: ease.out, delay: 0.6 }}
          >
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Projects</span>
            <span>/</span>
            <span className="is-current">{cat.title}</span>
          </motion.div>

          <div className="plist-head">
            <RevealText as="h1" lines={[cat.title]} className="plist-title" delay={0.5} play />
            <motion.div
              className="plist-meta"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: ease.out, delay: 0.8 }}
            >
              <p>{cat.tagline}.</p>
              <span>{pad(list.length)} projects</span>
            </motion.div>
          </div>

          <div className="switcher">
            {Object.values(categories).map((c) => (
              <Link key={c.key} to={`/projects/${c.key}`} className={`switch${c.key === category ? ' is-active' : ''}`}>
                {c.key === category && (
                  <motion.span layoutId="switch-pill" className="switch-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                <span>{c.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section plist">
        <div className="container pgrid pgrid-full">
          {list.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} className={i % 2 ? 'is-offset' : ''} />
          ))}
        </div>
      </section>

      <section className="next-cat">
        <Link to={`/projects/${other}`} className="next-cat-link" data-cursor="Explore">
          <div className="next-cat-media">
            <SmartImage src={categories[other].cover} alt="" width={1800} />
          </div>
          <div className="next-cat-content container">
            <span className="eyebrow">Continue exploring</span>
            <span className="next-cat-title">{categories[other].title}</span>
          </div>
        </Link>
      </section>
    </PageTransition>
  );
}
