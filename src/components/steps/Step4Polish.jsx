import { useState, useEffect, useRef } from 'react';
import { polishBullets, rephraseSingleBullet } from '../../api/claude';
import RansomText from '../RansomText';

function Spinner({ small }) {
  return (
    <div className={`${small ? 'w-3.5 h-3.5 border' : 'w-5 h-5 border-2'} border-red-500 border-t-transparent rounded-full animate-spin shrink-0`} />
  );
}

function BulletCard({ bullet, jdData, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(bullet.text);
  const [showOriginal, setShowOriginal] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const textareaRef = useRef();

  const canUndo = bullet.history.length > 1;

  function startEdit() {
    setEditText(bullet.text);
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function saveEdit() {
    if (editText.trim() && editText.trim() !== bullet.text) {
      onUpdate(bullet.id, editText.trim(), 'edit');
    }
    setEditing(false);
  }

  async function handleRewrite() {
    setRewriting(true);
    try {
      const result = await rephraseSingleBullet({
        bullet,
        jobDescription: jdData.jobDescription,
      });
      onUpdate(bullet.id, result.text, 'rewrite');
    } catch (e) {
      console.error('Rewrite failed:', e.message);
    } finally {
      setRewriting(false);
    }
  }

  return (
    <div className="border border-zinc-700 rounded-xl bg-zinc-800 overflow-hidden">
      {/* section label */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          bullet.sectionType === 'experience'
            ? 'bg-violet-900/40 text-violet-400'
            : 'bg-teal-900/40 text-teal-400'
        }`}>
          {bullet.sectionType === 'project' ? bullet.name : bullet.company}
        </span>
        <span className="text-xs text-zinc-500">{bullet.role}</span>
      </div>

      {/* polished text */}
      <div className="px-4 pt-2 pb-3">
        {editing ? (
          <div>
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={3}
              className="w-full text-sm text-zinc-200 leading-relaxed bg-zinc-900 border border-red-600 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={saveEdit}
                className="text-xs px-3 py-1 bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-600"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs px-3 py-1 text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-200 leading-relaxed">{bullet.text}</p>
        )}
      </div>

      {/* original (collapsible) */}
      {bullet.text !== bullet.original && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowOriginal(v => !v)}
            className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1"
          >
            <svg className={`w-3 h-3 transition-transform ${showOriginal ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {showOriginal ? 'Hide' : 'Show'} original
          </button>
          {showOriginal && (
            <p className="mt-1 text-xs text-zinc-600 leading-relaxed italic pl-4 border-l border-zinc-700">
              {bullet.original}
            </p>
          )}
        </div>
      )}

      {/* actions */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-zinc-800 bg-zinc-950">
        {!editing && (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-800 font-medium"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
        )}
        <button
          onClick={handleRewrite}
          disabled={rewriting}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-800 font-medium disabled:opacity-50"
        >
          {rewriting ? <Spinner small /> : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {rewriting ? 'Rewriting…' : 'Rewrite'}
        </button>
        {canUndo && !editing && (
          <button
            onClick={() => onUpdate(bullet.id, null, 'undo')}
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-800 font-medium ml-auto"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo
          </button>
        )}
      </div>
    </div>
  );
}

export default function Step4Polish({ onComplete, onBack, jdData, selectionData, initialData }) {
  const [bullets, setBullets] = useState(() => initialData?.bullets || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [repolishing, setRepolishing] = useState(false);

  const doPolish = useRef();
  doPolish.current = async (bulletsToPolish, feedbackText) => {
    const result = await polishBullets({
      bullets: bulletsToPolish,
      jobDescription: jdData.jobDescription,
      targetRole: jdData.targetRole,
      feedback: feedbackText,
    });
    const map = {};
    for (const b of result.bullets) map[b.id] = b.text;
    return map;
  };

  useEffect(() => {
    if (initialData) return;
    setLoading(true);
    setError(null);
    doPolish.current(selectionData.selectedBullets, '')
      .then(map => {
        setBullets(
          selectionData.selectedBullets.map(b => ({
            id: b.id,
            original: b.text,
            text: map[b.id] ?? b.text,
            history: [map[b.id] ?? b.text],
            sectionType: b.sectionType,
            company: b.company,
            name: b.name,
            role: b.role,
          }))
        );
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleUpdate(id, newText, action) {
    setBullets(prev => prev.map(b => {
      if (b.id !== id) return b;
      if (action === 'undo') {
        const hist = b.history.slice(0, -1);
        return { ...b, text: hist[hist.length - 1], history: hist };
      }
      return { ...b, text: newText, history: [...b.history, newText] };
    }));
  }

  async function handleRepolishAll() {
    setRepolishing(true);
    setError(null);
    try {
      const map = await doPolish.current(
        bullets.map(b => ({ id: b.id, text: b.text })),
        feedback
      );
      setBullets(prev => prev.map(b => {
        const t = map[b.id];
        if (!t) return b;
        return { ...b, text: t, history: [...b.history, t] };
      }));
      setFeedback('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRepolishing(false);
    }
  }

  function handleContinue() {
    const bulletMap = Object.fromEntries(bullets.map(b => [b.id, b.text]));
    onComplete({ bullets, bulletMap });
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl">
        <RansomText text="Polish Content" className="text-3xl mb-8" />
        <div className="flex flex-col items-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-300 font-medium">Polishing your bullets…</p>
          <p className="text-zinc-500 text-sm text-center max-w-xs">
            Claude is rewriting each bullet to better match the job description.
          </p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && !bullets.length) {
    return (
      <div className="max-w-2xl">
        <RansomText text="Polish Content" className="text-3xl mb-8" />
        <div className="p-5 bg-red-950/40 border border-red-900 rounded-xl">
          <p className="text-red-300 font-semibold mb-1">Error</p>
          <p className="text-red-400 text-sm font-mono mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                doPolish.current(selectionData.selectedBullets, '')
                  .then(map => setBullets(selectionData.selectedBullets.map(b => ({
                    id: b.id, original: b.text, text: map[b.id] ?? b.text,
                    history: [map[b.id] ?? b.text], sectionType: b.sectionType,
                    company: b.company, name: b.name, role: b.role,
                  }))))
                  .catch(e => setError(e.message))
                  .finally(() => setLoading(false));
              }}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium"
            >
              Retry
            </button>
            <button onClick={onBack} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 font-medium">
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <RansomText text="Polish Content" className="text-3xl" />
        <p className="text-zinc-500 mt-1 text-sm">
          Claude rewrote your bullets to match the role. Edit, rewrite individually, or re-polish all with feedback.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-900 rounded-lg text-sm text-red-400">{error}</div>
      )}

      <div className="space-y-3">
        {bullets.map((bullet, i) => (
          <BulletCard
            key={bullet.id}
            bullet={bullet}
            jdData={jdData}
            onUpdate={handleUpdate}
            index={i}
          />
        ))}
      </div>

      {/* Global re-polish */}
      <div className="mt-8 p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
        <p className="text-sm font-semibold text-zinc-300 mb-2">Re-polish all with feedback</p>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="e.g. Make bullets more concise. Emphasize leadership. Use more technical vocabulary."
          rows={2}
          className="w-full text-sm bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-600 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2"
        />
        <button
          onClick={handleRepolishAll}
          disabled={repolishing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium disabled:opacity-60"
        >
          {repolishing && <Spinner small />}
          {repolishing ? 'Re-polishing…' : '↺ Re-polish all'}
        </button>
      </div>

      <div className="flex items-center justify-between mt-6 pt-5 border-t border-zinc-800">
        <button onClick={onBack} className="text-sm text-zinc-500 hover:text-zinc-300 font-medium">
          ← Back
        </button>
        <button
          onClick={handleContinue}
          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
        >
          Confirm & Continue →
        </button>
      </div>
    </div>
  );
}
