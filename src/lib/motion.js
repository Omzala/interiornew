export const ease = {
  inOut: [0.76, 0, 0.24, 1],
  out: [0.22, 1, 0.36, 1],
  soft: [0.33, 1, 0.68, 1],
};

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: ease.out, delay: i * 0.08 },
  }),
};

export const pad = (n) => String(n).padStart(2, '0');
