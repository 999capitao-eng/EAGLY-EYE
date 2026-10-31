// Logo: águia de asas abertas. Para trocar, substitua este SVG ou use <img src="/logo.png" />
export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Eagle Eye">
      <path d="M32 18 L21 12 L3 15 L12 21 L1 28 L15 30 L8 38 L25 34 L32 50Z" fill="#19e36a" />
      <path d="M32 18 L43 12 L61 15 L52 21 L63 28 L49 30 L56 38 L39 34 L32 50Z" fill="#19e36a" />
      <path d="M32 14 L38 22 L35 32 L32 46 L29 32 L26 22Z" fill="#050605" stroke="#19e36a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M28 24 L32 26 L36 24" stroke="#19e36a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="22" r="1.6" fill="#19e36a" />
    </svg>
  );
}
