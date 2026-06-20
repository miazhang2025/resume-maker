// Ransom-note / punk-zine text: every letter sits on its own colored block,
// rotated a touch, in the Lacquer display font.
const BLOCKS = ['#ffffff', 'var(--accent-lime)', '#ffffff', 'var(--accent)'];

export default function RansomText({ text, className = '', nowrap = false }) {
  let letterIndex = -1;

  return (
    <div
      className={`ransom ${className}`}
      style={nowrap ? { flexWrap: 'nowrap', gap: '4px 2px' } : undefined}
      aria-label={text}
      role="heading"
    >
      {[...text].map((ch, i) => {
        if (ch === ' ') return <span key={i} className="ransom-gap" />;

        letterIndex += 1;
        const bg = BLOCKS[letterIndex % BLOCKS.length];
        const rot = (letterIndex % 2 === 0 ? -1 : 1) * (2 + (letterIndex % 3));

        return (
          <span
            key={i}
            className="ransom-char"
            aria-hidden="true"
            style={{ background: bg, transform: `rotate(${rot}deg)` }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
}
