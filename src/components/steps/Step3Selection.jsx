import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  DragOverlay,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { scoreRelevance } from '../../api/claude';
import RansomText from '../RansomText';

const AI_THRESHOLD = 0.55;

function formatDate(str) {
  if (!str || str === 'Present') return 'Present';
  const [year, month] = str.split('-');
  return new Date(year, (month || 1) - 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

function GripIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 12 20">
      <circle cx="3" cy="3" r="1.5" />
      <circle cx="9" cy="3" r="1.5" />
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="9" cy="8" r="1.5" />
      <circle cx="3" cy="13" r="1.5" />
      <circle cx="9" cy="13" r="1.5" />
      <circle cx="3" cy="18" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function ScorePill({ score }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const cls =
    score >= 0.75 ? 'bg-green-900/50 text-green-400' :
    score >= AI_THRESHOLD ? 'bg-red-950/60 text-red-400' :
    score >= 0.35 ? 'bg-amber-900/50 text-amber-400' :
    'bg-zinc-800 text-zinc-500';
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-medium ${cls}`}>
      {pct}%
    </span>
  );
}

function BulletCard({ bullet, isSelected, onToggle, score, isOverlay = false }) {
  const isAIPick = score != null && score >= AI_THRESHOLD;
  return (
    <div className={`
      flex items-start gap-3 px-4 py-3 rounded-lg border transition-all select-none
      ${isOverlay ? 'shadow-lg bg-zinc-800 border-red-800 rotate-1' : ''}
      ${!isOverlay && isSelected ? 'bg-zinc-800 border-zinc-700 shadow-sm' : ''}
      ${!isOverlay && !isSelected ? 'bg-zinc-900 border-transparent' : ''}
    `}>
      {/* checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(bullet.id)}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 w-4 h-4 rounded border-zinc-600 text-red-400 cursor-pointer shrink-0 accent-red-500"
      />
      {/* content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${isSelected ? 'text-zinc-200' : 'text-zinc-500'}`}>
          {bullet.text}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {isAIPick && (
            <span className="inline-flex items-center gap-0.5 text-xs text-red-400 font-medium">
              <StarIcon /> AI pick
            </span>
          )}
          <ScorePill score={score} />
          {bullet.tags?.slice(0, 4).map(tag => (
            <span key={tag} className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SortableBullet({ bullet, isSelected, onToggle, score }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bullet.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-stretch gap-0 ${isDragging ? 'opacity-30' : ''}`}
    >
      {/* drag handle — separate from card so checkbox click doesn't drag */}
      <button
        {...attributes}
        {...listeners}
        className="flex items-center px-2 text-zinc-600 hover:text-zinc-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripIcon />
      </button>
      <div className="flex-1 min-w-0">
        <BulletCard
          bullet={bullet}
          isSelected={isSelected}
          onToggle={onToggle}
          score={score}
        />
      </div>
    </div>
  );
}

function buildSections(resumeData) {
  return [
    ...resumeData.experience.map(exp => ({
      type: 'experience',
      id: exp.id,
      company: exp.company,
      role: exp.role,
      start: exp.start,
      end: exp.end,
      bullets: [...exp.bullets],
    })),
    ...resumeData.projects.map(proj => ({
      type: 'project',
      id: proj.id,
      name: proj.name,
      role: proj.role,
      start: proj.start,
      end: proj.end,
      bullets: [...proj.bullets],
    })),
  ];
}

export default function Step3Selection({ onComplete, onBack, resumeData, jdData, initialData }) {
  const [sections, setSections] = useState(() =>
    initialData?.sections || buildSections(resumeData)
  );
  const [selected, setSelected] = useState(() => new Set(initialData?.selected || []));
  const [scores, setScores] = useState(() => initialData?.scores || {});
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Use a ref so the fetch function always closes over latest state setters but
  // we can call it both on mount and from the retry button without re-registering effects.
  const fetchRef = useRef();
  fetchRef.current = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await scoreRelevance({
        resumeData,
        jobDescription: jdData.jobDescription,
        targetRole: jdData.targetRole,
      });
      const newScores = {};
      const autoSelected = new Set();
      for (const { id, score } of result.scores) {
        newScores[id] = score;
        if (score >= AI_THRESHOLD) autoSelected.add(id);
      }
      setScores(newScores);
      setSelected(autoSelected);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) fetchRef.current();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleToggle(bulletId) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(bulletId) ? next.delete(bulletId) : next.add(bulletId);
      return next;
    });
  }

  function handleDragStart({ active }) {
    setActiveId(active.id);
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setSections(prev =>
      prev.map(section => {
        const ids = section.bullets.map(b => b.id);
        const aIdx = ids.indexOf(String(active.id));
        const oIdx = ids.indexOf(String(over.id));
        if (aIdx === -1 || oIdx === -1) return section;
        return { ...section, bullets: arrayMove(section.bullets, aIdx, oIdx) };
      })
    );
  }

  function handleContinue() {
    const selectedBullets = [];
    for (const section of sections) {
      for (const bullet of section.bullets) {
        if (selected.has(bullet.id)) {
          selectedBullets.push({
            ...bullet,
            sectionType: section.type,
            company: section.company,
            name: section.name,
            role: section.role,
          });
        }
      }
    }
    onComplete({ sections, selected: [...selected], selectedBullets, scores });
  }

  const allIds = sections.flatMap(s => s.bullets.map(b => b.id));
  const totalSelected = selected.size;

  // Find the active bullet for the drag overlay
  const activeBullet = activeId
    ? sections.flatMap(s => s.bullets).find(b => b.id === String(activeId))
    : null;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl">
        <RansomText text="Select Bullets" className="text-3xl mb-8" />
        <div className="flex flex-col items-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-300 font-medium">Analyzing job description…</p>
          <p className="text-zinc-500 text-sm text-center max-w-xs">
            Claude is scoring each bullet for relevance to the role. This takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-2xl">
        <RansomText text="Select Bullets" className="text-3xl mb-8" />
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-800 font-semibold mb-1">Claude API error</p>
          <p className="text-red-600 text-sm font-mono mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchRef.current()}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium"
            >
              Retry
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 font-medium"
            >
              ← Back
            </button>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-3">
          Make sure <code className="bg-zinc-800 px-1 py-0.5 rounded">ANTHROPIC_API_KEY</code> is set in <code className="bg-zinc-800 px-1 py-0.5 rounded">.env.local</code>
        </p>
      </div>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <RansomText text="Select Bullets" className="text-3xl" />
        <p className="text-zinc-500 mt-1 text-sm">
          Claude scored each bullet for this role.{' '}
          <span className="text-red-400 font-medium inline-flex items-center gap-0.5">
            <StarIcon /> AI picks
          </span>{' '}
          are pre-selected. Drag the grip handle to reorder within a section.
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-red-950/40 border border-red-900 rounded-lg mb-6">
        <span className="text-sm text-red-200">
          <span className="font-semibold">{totalSelected}</span>{' '}
          {totalSelected === 1 ? 'bullet' : 'bullets'} selected
          {totalSelected === 0 && (
            <span className="text-red-400 ml-2">— pick at least one</span>
          )}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelected(new Set(allIds))}
            className="text-xs text-red-400 hover:text-red-300 font-medium"
          >
            Select all
          </button>
          <span className="text-rose-200 text-xs">|</span>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-red-400 hover:text-red-300 font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-10">
          {sections.map(section => {
            const sectionSelected = section.bullets.filter(b => selected.has(b.id)).length;
            return (
              <div key={section.id}>
                {/* Section header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        section.type === 'experience'
                          ? 'bg-violet-900/50 text-violet-300'
                          : 'bg-teal-900/50 text-teal-300'
                      }`}>
                        {section.type === 'experience' ? 'Experience' : 'Project'}
                      </span>
                      <h3 className="font-semibold text-zinc-100 text-sm">
                        {section.type === 'project' ? section.name : section.company}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 ml-0.5">
                      {section.role} · {formatDate(section.start)} – {formatDate(section.end)}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 shrink-0 mt-0.5">
                    {sectionSelected}/{section.bullets.length}
                  </span>
                </div>

                {/* Sortable bullets */}
                <SortableContext
                  items={section.bullets.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {section.bullets.map(bullet => (
                      <SortableBullet
                        key={bullet.id}
                        bullet={bullet}
                        isSelected={selected.has(bullet.id)}
                        onToggle={handleToggle}
                        score={scores[bullet.id]}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        {/* Ghost card while dragging */}
        <DragOverlay>
          {activeBullet && (
            <div className="flex items-stretch gap-0 cursor-grabbing">
              <div className="flex items-center px-2 text-zinc-500">
                <GripIcon />
              </div>
              <div className="flex-1">
                <BulletCard
                  bullet={activeBullet}
                  isSelected={selected.has(activeBullet.id)}
                  onToggle={() => {}}
                  score={scores[activeBullet.id]}
                  isOverlay
                />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Footer */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-zinc-700">
        <button
          onClick={onBack}
          className="text-sm text-zinc-500 hover:text-zinc-300 font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          disabled={totalSelected === 0}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            totalSelected > 0
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          Polish with Claude ({totalSelected}) →
        </button>
      </div>
    </div>
  );
}
