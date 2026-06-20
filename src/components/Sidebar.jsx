import RansomText from './RansomText';

const STEPS = [
  { number: 1, label: 'Upload Resume' },
  { number: 2, label: 'Job Description' },
  { number: 3, label: 'Select Bullets' },
  { number: 4, label: 'Polish Content' },
  { number: 5, label: 'Skills' },
  { number: 6, label: 'Export PDF' },
];

export default function Sidebar({ currentStep, onStepClick, completedSteps, onHome }) {
  return (
    <aside className="w-56 min-h-screen bg-zinc-950/85 backdrop-blur flex flex-col py-8 px-4 shrink-0 border-r-2 border-zinc-800">
      <button onClick={onHome} className="mb-10 px-2 text-left group">
        <RansomText text="Fk Resume" nowrap className="text-base leading-none group-hover:opacity-90 transition-opacity" />
        <p className="text-zinc-600 text-[11px] mt-2 uppercase tracking-widest">One résumé per role</p>
      </button>

      <nav className="flex flex-col gap-0.5">
        {STEPS.map((step) => {
          const isDone = completedSteps.includes(step.number);
          const isActive = currentStep === step.number;
          const isReachable = step.number <= Math.max(...completedSteps, 1) + 1;

          return (
            <button
              key={step.number}
              onClick={() => isReachable && onStepClick(step.number)}
              disabled={!isReachable}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors
                ${isActive
                  ? 'bg-zinc-800 text-white'
                  : isDone
                    ? 'text-zinc-400 hover:bg-zinc-900 cursor-pointer'
                    : isReachable
                      ? 'text-zinc-500 hover:bg-zinc-900 cursor-pointer'
                      : 'text-zinc-700 cursor-not-allowed'
                }
              `}
            >
              <span className={`
                w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0
                ${isActive
                  ? 'bg-red-600 text-white'
                  : isDone
                    ? 'bg-zinc-700 text-zinc-300'
                    : 'bg-zinc-900 border border-zinc-700 text-zinc-600'
                }
              `}>
                {isDone && !isActive ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </span>
              <span className="font-medium text-xs tracking-wide">{step.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-6">
        <p className="text-zinc-700 text-xs">Powered by Claude</p>
      </div>
    </aside>
  );
}
