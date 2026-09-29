import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SmartImage from './SmartImage';
import { ArrowUpRight } from './Icons';
import { ease, pad } from '../lib/motion';

export default function ProjectCard({ project, index, className = '' }) {
  return (
    <motion.article
      className={`pcard ${className}`}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.1, ease: ease.out, delay: (index % 2) * 0.12 }}
    >
      <Link to={`/projects/${project.category}/${project.slug}`} data-cursor="View" className="pcard-link">
        <motion.div
          className="pcard-media"
          initial={{ clipPath: 'inset(12% 8% 12% 8%)' }}
          whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.4, ease: ease.inOut }}
        >
          <SmartImage src={project.cover} alt={project.title} width={1200} />
          <span className="pcard-overlay">
            <span className="pcard-count">{pad(project.images.length)} photographs</span>
            <span className="pcard-open">
              Open gallery <ArrowUpRight size={14} />
            </span>
          </span>
        </motion.div>
        <div className="pcard-meta">
          <span className="pcard-num">{pad(index + 1)}</span>
          <div className="pcard-titles">
            <h3 className="pcard-title">{project.title}</h3>
            <p className="pcard-sub">
              {[project.type, project.location].filter(Boolean).join(' · ')}
            </p>
          </div>
          {project.year && <span className="pcard-year">{project.year}</span>}
        </div>
      </Link>
    </motion.article>
  );
}
