import { useState, useRef } from 'react';
import { parseResumePdf, fillResumeGaps } from '../../api/claude';
import RansomText from '../RansomText';

// --- helpers ---------------------------------------------------------------

function readPdfAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

// Safety net so the rest of the app never breaks on a missing id / array,
// even if the model forgets one. This is structure only — never user data.
function ensureShape(resume) {
  const r = { personal: {}, education: [], experience: [], projects: [], skills: [], ...resume };
  r.personal = r.personal || {};
  r.education = (r.education || []).map((e, i) => ({ ...e, id: e.id || `edu${i + 1}` }));
  r.skills = (r.skills || []).map((s, i) => ({ ...s, id: s.id || `skill${i + 1}`, items: s.items || [] }));
  const fixSection = (arr, prefix) =>
    (arr || []).map((item, i) => {
      const id = item.id || `${prefix}${i + 1}`;
      return {
        ...item,
        id,
        tags: item.tags || [],
        bullets: (item.bullets || []).map((b, j) => ({ ...b, id: b.id || `${id}-b${j + 1}`, tags: b.tags || [] })),
      };
    });
  r.experience = fixSection(r.experience, 'exp');
  r.projects = fixSection(r.projects, 'proj');
  return r;
}

// --- sub-components ---------------------------------------------------------

function PersonalPreview({ data }) {
  const { personal, education, experience, projects, skills } = data;
  return (
    <div className="mt-6 border-2 border-zinc-700 overflow-hidden">
      <div className="bg-zinc-900 border-b-2 border-zinc-700 px-4 py-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[var(--accent-lime)]" />
        <span className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">Parsed from your PDF</span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold text-zinc-100 text-base">{personal.name || '—'}</p>
          <p className="text-zinc-500">{personal.email || 'no email yet'}</p>
          {personal.location && <p className="text-zinc-500">{personal.location}</p>}
        </div>
        <div className="space-y-1 text-zinc-400">
          <Row label="Education" value={`${education.length} entr${education.length === 1 ? 'y' : 'ies'}`} />
          <Row label="Experience" value={`${experience.length} roles (${experience.flatMap(e => e.bullets).length} bullets)`} />
          <Row label="Projects" value={`${projects.length} (${projects.flatMap(p => p.bullets).length} bullets)`} />
          <Row label="Skill groups" value={skills.length} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// --- main -------------------------------------------------------------------

export default function Step1Upload({ onComplete, initialData }) {
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState(initialData ? 'review' : 'idle'); // idle | parsing | review | error
  const [fileName, setFileName] = useState('');
  const [resume, setResume] = useState(initialData || null);
  const [missing, setMissing] = useState([]);
  const [answers, setAnswers] = useState({});
  const [filling, setFilling] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const requiredMissing = missing.filter(m => m.required);
  const canContinue =
    resume && resume.personal?.name && resume.personal?.email && requiredMissing.length === 0;

  async function handleFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF résumé.');
      setStatus('error');
      return;
    }

    setFileName(file.name);
    setError('');
    setStatus('parsing');
    try {
      const base64 = await readPdfAsBase64(file);
      const result = await parseResumePdf({ base64 });
      setResume(ensureShape(result.resume));
      setMissing(Array.isArray(result.missing) ? result.missing : []);
      setAnswers({});
      setStatus('review');
    } catch (e) {
      setError(e.message || 'Something went wrong reading the PDF.');
      setStatus('error');
    }
  }

  async function applyAnswers() {
    const payload = missing.map(m => ({ field: m.field, question: m.question, answer: answers[m.field] || '' }));
    setFilling(true);
    setError('');
    try {
      const result = await fillResumeGaps({ resume, answers: payload });
      setResume(ensureShape(result.resume));
      setMissing(Array.isArray(result.missing) ? result.missing : []);
      setAnswers({});
    } catch (e) {
      setError(e.message || 'Could not apply your answers.');
    } finally {
      setFilling(false);
    }
  }

  const hasTypedAnswer = Object.values(answers).some(v => v && v.trim());

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <RansomText text="Upload Your Résumé" className="text-3xl mb-3" />
        <p className="text-stone-400 mt-1 text-sm leading-relaxed">
          Drop your existing résumé as a <span className="text-white font-semibold">PDF</span>. Claude reads it,
          turns it into structured data, and asks you to fill in anything that’s missing.
        </p>
      </div>

      {/* Dropzone (hidden once parsing/reviewing) */}
      {status !== 'parsing' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current.click()}
          className={`border-2 border-dashed p-10 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-[var(--accent)] bg-red-950/40' : 'border-zinc-700 hover:border-[var(--accent-lime)] bg-zinc-900/50'}`}
        >
          <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden"
            onChange={(e) => handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-[var(--accent)] flex items-center justify-center -rotate-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M9 13h6 M9 17h6" />
              </svg>
            </div>
            <div>
              <p className="text-zinc-200 font-semibold">{fileName ? 'Drop a different PDF' : 'Drop your résumé PDF here'}</p>
              <p className="text-zinc-500 text-sm mt-0.5">or click to browse</p>
            </div>
          </div>
        </div>
      )}

      {/* Parsing */}
      {status === 'parsing' && (
        <div className="border-2 border-zinc-700 bg-zinc-900/50 p-10 flex flex-col items-center gap-4">
          <div className="w-9 h-9 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-300 text-sm font-medium">Reading <span className="text-white">{fileName}</span> with Claude…</p>
          <p className="text-zinc-600 text-xs">Extracting experience, projects, education & skills</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-950/50 border-l-4 border-[var(--accent)]">
          <p className="text-red-300 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Review + interactive gap filling */}
      {status === 'review' && resume && (
        <>
          <PersonalPreview data={resume} />

          {missing.length > 0 && (
            <div className="mt-6 border-2 border-[var(--accent)]/60 bg-zinc-900/60">
              <div className="px-4 py-3 border-b-2 border-zinc-800 flex items-center gap-2">
                <span className="font-['Lacquer'] text-black bg-[var(--accent-lime)] text-sm px-2 -rotate-2">!</span>
                <span className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">A few things are missing</span>
              </div>
              <div className="p-4 space-y-4">
                {missing.map((m) => (
                  <div key={m.field}>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                      {m.question}
                      {m.required
                        ? <span className="ml-2 text-[var(--accent)] text-xs font-bold uppercase">required</span>
                        : <span className="ml-2 text-zinc-600 text-xs uppercase">optional</span>}
                    </label>
                    <input
                      type="text"
                      value={answers[m.field] || ''}
                      onChange={(e) => setAnswers(a => ({ ...a, [m.field]: e.target.value }))}
                      placeholder="Type your answer…"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border-2 border-zinc-700 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[var(--accent-lime)] transition"
                    />
                  </div>
                ))}

                <button
                  onClick={applyAnswers}
                  disabled={filling || !hasTypedAnswer}
                  className={`w-full py-2.5 text-sm font-bold uppercase tracking-widest transition-colors
                    ${filling || !hasTypedAnswer
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-lime)] hover:text-black'}`}
                >
                  {filling ? 'Updating your résumé…' : 'Apply answers'}
                </button>
                {requiredMissing.length === 0 && (
                  <p className="text-zinc-500 text-xs text-center">
                    Optional fields left — you can fill them or just continue.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer nav */}
      <div className="mt-6 flex items-center justify-end">
        <button
          onClick={() => canContinue && onComplete(resume)}
          disabled={!canContinue}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-widest -rotate-1 transition-all
            ${canContinue
              ? 'bg-[var(--accent)] text-white hover:rotate-0 hover:bg-[var(--accent-lime)] hover:text-black shadow-[4px_4px_0_rgba(0,0,0,0.7)]'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
