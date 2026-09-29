import { motion } from 'framer-motion';
import { ease } from '../lib/motion';

const tags = { h1: motion.h1, h2: motion.h2, h3: motion.h3, p: motion.p, div: motion.div };

/**
 * Splits text into words and slides each one up from behind a mask.
 * `lines` may be an array to force line breaks; wrap a word in *asterisks*
 * to render it in italic accent style.
 */
export default function RevealText({
  lines,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  stagger = 0.06,
  play,
  once = true,
}) {
  const list = Array.isArray(lines) ? lines : [lines];
  let wordIndex = 0;
  const controlled = play !== undefined;

  const MotionTag = tags[Tag] || motion.h2;

  return (
    <MotionTag
      className={`reveal-text ${className}`}
      initial="hidden"
      {...(controlled
        ? { animate: play ? 'show' : 'hidden' }
        : { whileInView: 'show', viewport: { once, amount: 0.4 } })}
    >
      {list.map((line, li) => (
        <span className="reveal-line" key={li}>
          {line.split(' ').map((word, wi) => {
            const i = wordIndex++;
            const italic = /^\*.*\*[.,]?$/.test(word);
            const clean = italic ? word.replace(/\*/g, '') : word;
            return (
              <span className="reveal-mask" key={wi}>
                <motion.span
                  className={`reveal-word${italic ? ' is-italic' : ''}`}
                  variants={{
                    hidden: { y: '110%', rotate: 4 },
                    show: {
                      y: '0%',
                      rotate: 0,
                      transition: { duration: 1.1, ease: ease.out, delay: delay + i * stagger },
                    },
                  }}
                >
                  {clean}
                </motion.span>
                {' '}
              </span>
            );
          })}
        </span>
      ))}
    </MotionTag>
  );
}
