/** Lightweight vector ornament: rotation does not repaint the background photograph. */
export default function HeroChakra() {
  return (
    <svg className="hero-chakra" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <g fill="currentColor" fillOpacity="0.07" stroke="currentColor" strokeWidth="1">
        {[0, 1, 2].map(ring => <circle key={ring} cx="200" cy="200" r={80 + ring * 54} fill="none" />)}
        {Array.from({ length: 16 }, (_, index) => (
          <g key={index} transform={`rotate(${index * 22.5} 200 200)`}>
            <path d="M200 200C173 156 176 95 200 16C224 95 227 156 200 200Z" />
            <path d="M200 184C185 141 188 100 200 58C212 100 215 141 200 184Z" fill="none" />
            <path d="M200 192V36" fill="none" strokeOpacity="0.5" />
            <circle cx="200" cy="42" r="3" />
          </g>
        ))}
        <circle cx="200" cy="200" r="28" />
        <circle cx="200" cy="200" r="14" fill="none" />
      </g>
    </svg>
  );
}
