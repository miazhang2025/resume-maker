import { useState } from 'react';

const JD_PLACEHOLDER = `Paste the full job description here...

Example:
We are looking for a Senior Software Engineer to join our platform team. You will design and build distributed systems handling millions of requests per day...`;

export default function Step2JDInput({ onComplete, onBack, initialData }) {
  const [jd, setJd] = useState(initialData?.jobDescription || '');
  const [targetRole, setTargetRole] = useState(initialData?.targetRole || '');

  const canContinue = jd.trim().length > 50;
  const wordCount = jd.trim() ? jd.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-100">Paste Job Description</h2>
        <p className="text-zinc-500 mt-1 text-sm">
          Claude will analyze the JD to select and tailor your resume bullets.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Target Role Title <span className="text-zinc-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior Software Engineer, Product Manager"
            className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Job Description <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder={JD_PLACEHOLDER}
              rows={18}
              className="w-full px-3.5 py-3 rounded-lg border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none font-mono leading-relaxed"
            />
            {wordCount > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                {wordCount} words
              </div>
            )}
          </div>
          {jd.trim() && !canContinue && (
            <p className="mt-1.5 text-xs text-amber-600">
              Please paste the full job description (minimum 50 words).
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-red-950/40 border border-red-900 rounded-lg">
        <p className="text-red-300 text-xs font-medium mb-1">What Claude will do next</p>
        <ul className="text-red-400 text-xs space-y-0.5 list-disc list-inside">
          <li>Score each bullet point 0–1 for relevance to this JD</li>
          <li>Pre-select the most relevant bullets for your review</li>
          <li>Later, rewrite bullets to match the job's language and keywords</li>
        </ul>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1 font-medium"
        >
          ← Back
        </button>

        <button
          onClick={() => canContinue && onComplete({ jobDescription: jd.trim(), targetRole: targetRole.trim() })}
          disabled={!canContinue}
          className={`
            px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
            ${canContinue
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }
          `}
        >
          Analyze with Claude →
        </button>
      </div>
    </div>
  );
}
