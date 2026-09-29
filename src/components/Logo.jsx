/** Anvee monogram: an arched doorway enclosing an "A". */
export function LogoMark({ size = 36, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 1.2}
      viewBox="0 0 40 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 47V20C3 10.6 10.6 3 20 3s17 7.6 17 17v27"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M7.5 47V21c0-6.9 5.6-12.5 12.5-12.5S32.5 14.1 32.5 21v26" stroke="currentColor" strokeWidth="0.7" opacity="0.55" />
      <path d="M12 44 20 17l8 27M14.6 35.5h10.8" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M1 47h38" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export default function Logo({ className = '' }) {
  return (
    <span className={`logo ${className}`}>
      <LogoMark size={26} />
      <span className="logo-word">
        <span className="logo-name">ANVEE</span>
        <span className="logo-sub">Interiors</span>
      </span>
    </span>
  );
}
