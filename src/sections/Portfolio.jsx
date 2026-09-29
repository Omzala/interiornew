import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RevealText from '../components/RevealText';
import SmartImage from '../components/SmartImage';
import ProjectCard from '../components/ProjectCard';
import Magnetic from '../components/Magnetic';
import { ArrowRight, ArrowUpRight } from '../components/Icons';
import { categories, getProjectsByCategory } from '../data/projects';
import { ease, pad } from '../lib/motion';

const keys = Object.keys(categories);

/** Paired category doors, each leading to its project listing. */
function CategoryDoors() {
  const [active, setActive] = useState(null);

  return (
    <div className="doors" onPointerLeave={() => setActive(null)}>
      {[keys.slice(0, 2), keys.slice(2)].map((row) => (
        <div className="door-row" key={row[0]}>
        {row.map((key) => {
        const i = keys.indexOf(key);
        const cat = categories[key];
        const count = getProjectsByCategory(key).length;
        return (
          <motion.div
            key={key}
            className={`door${active === key ? ' is-active' : ''}${active && active !== key ? ' is-dim' : ''}`}
            onPointerEnter={(event) => event.pointerType === 'mouse' && setActive(key)}
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 1.2, ease: ease.out, delay: i * 0.15 }}
          >
            <Link to={`/projects/${key}`} className="door-link" data-cursor="Explore">
              <div className="door-media">
                <SmartImage src={cat.cover} alt={`${cat.title} interiors`} width={1400} />
              </div>
              <div className="door-shade" />
              <div className="door-content">
                <span className="door-num">{pad(i + 1)}</span>
                <div>
                  <p className="door-count">{pad(count)} Projects</p>
                  <h3 className="door-title">{cat.title}</h3>
                  <p className="door-tagline">{cat.tagline}</p>
                </div>
                <span className="door-arrow">
                  <ArrowUpRight size={22} />
                </span>
              </div>
            </Link>
          </motion.div>
        );
        })}
        </div>
      ))}
    </div>
  );
}

export default function Portfolio() {
  const [tab, setTab] = useState('residential');
  const list = getProjectsByCategory(tab);

  return (
    <section className="section portfolio" id="projects">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="section-label">
              <span>(02)</span> Portfolio
            </div>
            <RevealText lines={['Selected', '*works*']} className="section-title" />
          </div>
          <motion.p
            className="section-intro"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: ease.out, delay: 0.3 }}
          >
            Explore our residential, commercial, hospitality and industrial spaces. Choose a category,
            then step inside a project through its full image gallery.
          </motion.p>
        </div>

        <CategoryDoors />

        <div className="tabs-row">
          <div className="tabs" role="tablist" aria-label="Project category">
            {keys.map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                className={`tab${tab === key ? ' is-active' : ''}`}
                onClick={() => setTab(key)}
              >
                {tab === key && (
                  <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                <span className="tab-text">{categories[key].title}</span>
                <span className="tab-count">{pad(getProjectsByCategory(key).length)}</span>
              </button>
            ))}
          </div>
          <Magnetic strength={0.2}>
            <Link to={`/projects/${tab}`} className="btn btn-outline">
              <span>View all {categories[tab].title.toLowerCase()}</span>
              <ArrowRight />
            </Link>
          </Magnetic>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="pgrid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 40, transition: { duration: 0.4, ease: ease.inOut } }}
          >
            {list.slice(0, 4).map((p, i) => (
              <ProjectCard key={p.slug} project={p} index={i} className={i % 2 ? 'is-offset' : ''} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
