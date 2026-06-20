import RansomText from './RansomText';

const STEPS = [
  {
    n: '01',
    title: 'Drop your résumé PDF',
    body: 'Upload your existing résumé. Claude reads it into structured data and asks you to fill in anything missing.',
  },
  {
    n: '02',
    title: 'Paste the job post',
    body: 'Whatever role you are gunning for — copy the full description in. The more detail, the sharper the cut.',
  },
  {
    n: '03',
    title: 'It picks what fits',
    body: 'Claude scores every bullet against the JD and hand-picks the experience that actually matches the role.',
  },
  {
    n: '04',
    title: 'It polishes the rest',
    body: 'Selected bullets get rewritten in the job’s own language, then the skills that matter get pushed to the top.',
  },
  {
    n: '05',
    title: 'Ship a targeted PDF',
    body: 'Out comes a clean, role-specific résumé — a different sharp version for every job, in minutes. Cover letter optional.',
  },
];

function Sticker({ src, className, tint }) {
  return (
    <img
      src={`/asset/${src}`}
      alt=""
      aria-hidden="true"
      className={`sticker ${tint || ''} ${className}`}
    />
  );
}

export default function Intro({ onStart }) {
  return (
    <div className="app-glow halftone relative min-h-screen w-full flex flex-col items-center px-6 py-16 overflow-hidden">
      {/* Punk sticker decorations */}
      <Sticker src="element 07.svg" tint="tint-lime" className="top-10 left-8 w-20 animate-wiggle" />
      <Sticker src="element 03.svg" className="top-24 right-12 w-24 rotate-12" />
      <Sticker src="element 01.svg" tint="tint-magenta" className="bottom-10 left-10 w-28 -rotate-6 opacity-80" />
      <Sticker src="element 10.svg" tint="tint-lime" className="top-[44%] right-6 w-32 -rotate-3" />
      <Sticker src="element 04.svg" className="bottom-24 right-24 w-28 rotate-6 opacity-70" />

      <div className="relative max-w-3xl w-full">
        {/* Hero */}
        <div className="mb-14">
          <span className="inline-block bg-[var(--accent-lime)] text-black text-[11px] font-bold tracking-[0.3em] uppercase px-2 py-1 mb-6 -rotate-1">
            AI résumé builder · powered by Claude
          </span>

          <RansomText text="Fk Resume" className="text-6xl sm:text-7xl mb-7" />

          <p className="text-stone-300 text-base sm:text-lg max-w-xl leading-relaxed border-l-4 border-[var(--accent)] pl-4">
            <span className="text-white font-semibold">One razor-sharp résumé per job — without the busywork.</span>{' '}
            Paste a job description; it hand-picks the experience that fits, rewrites
            it to match, and hands you a résumé built for that exact role.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-12">
          <RansomText text="How it works" className="text-2xl sm:text-3xl mb-7" />

          <div className="space-y-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="group flex gap-4 p-4 bg-zinc-950/70 border-l-4 border-zinc-800 hover:border-[var(--accent)] hover:bg-zinc-900/70 transition-colors"
              >
                <span
                  className="font-['Lacquer'] text-black bg-[var(--accent-lime)] text-xl shrink-0 h-10 w-10 flex items-center justify-center -rotate-3 group-hover:bg-[var(--accent)] group-hover:text-white transition-colors"
                >
                  {s.n}
                </span>
                <div>
                  <p className="text-white font-semibold text-sm mb-0.5 uppercase tracking-wide">{s.title}</p>
                  <p className="text-stone-400 text-sm leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-start gap-3">
          <button
            onClick={onStart}
            className="bg-[var(--accent)] text-white font-bold text-sm uppercase tracking-widest px-8 py-4 -rotate-1 hover:rotate-0 hover:bg-[var(--accent-lime)] hover:text-black transition-all shadow-[5px_5px_0_rgba(0,0,0,0.7)]"
          >
            Tear up your résumé →
          </button>
          <p className="text-stone-600 text-xs pl-1">
            ~5 minutes · everything stays in your browser
          </p>
        </div>
      </div>
    </div>
  );
}
