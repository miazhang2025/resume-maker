import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
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
import { recommendSkills } from '../../api/claude';

function GripIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 12 20">
      <circle cx="3" cy="3" r="1.5" /><circle cx="9" cy="3" r="1.5" />
      <circle cx="3" cy="8" r="1.5" /><circle cx="9" cy="8" r="1.5" />
      <circle cx="3" cy="13" r="1.5" /><circle cx="9" cy="13" r="1.5" />
      <circle cx="3" cy="18" r="1.5" /><circle cx="9" cy="18" r="1.5" />
    </svg>
  );
}

function SkillChip({ item, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-full">
      {item}
      <button onClick={() => onRemove(item)} className="text-zinc-500 hover:text-zinc-400 ml-0.5">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

function SortableCategory({ cat, onToggleItem, onRemoveItem, onAddItem, onUpdateName }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const [addInput, setAddInput] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(cat.category);

  function submitAdd(e) {
    e.preventDefault();
    const val = addInput.trim();
    if (val && !cat.items.includes(val)) {
      onAddItem(cat.id, val);
      setAddInput('');
    }
  }

  function saveName() {
    if (nameVal.trim()) onUpdateName(cat.id, nameVal.trim());
    setEditingName(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-700 bg-zinc-900">
        <button
          {...attributes}
          {...listeners}
          className="text-zinc-600 hover:text-zinc-500 cursor-grab active:cursor-grabbing touch-none"
          tabIndex={-1}
        >
          <GripIcon />
        </button>
        {editingName ? (
          <input
            autoFocus
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => e.key === 'Enter' && saveName()}
            className="flex-1 text-sm font-semibold text-zinc-200 bg-transparent border-b border-red-600 focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex-1 text-sm font-semibold text-zinc-200 text-left hover:text-red-400"
          >
            {cat.category}
          </button>
        )}
        <span className="text-xs text-zinc-500">{cat.items.length} skills</span>
      </div>
      <div className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {cat.items.map(item => (
            <SkillChip key={item} item={item} onRemove={item => onRemoveItem(cat.id, item)} />
          ))}
          {cat.items.length === 0 && (
            <p className="text-xs text-zinc-500 italic">No skills yet — add one below</p>
          )}
        </div>
        <form onSubmit={submitAdd} className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={addInput}
            onChange={e => setAddInput(e.target.value)}
            placeholder="Add skill…"
            className="flex-1 text-xs border border-zinc-700 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!addInput.trim()}
            className="text-xs px-3 py-1.5 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 disabled:opacity-40 font-medium"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}

function buildFromResumeData(resumeData) {
  return resumeData.skills.map((s, i) => ({
    id: s.id || `skill-${i}`,
    category: s.category,
    items: [...s.items],
  }));
}

export default function Step5Skills({ onComplete, onBack, resumeData, jdData, selectionData, polishData, initialData }) {
  const [skills, setSkills] = useState(() => initialData?.skills || buildFromResumeData(resumeData));
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [newCatInput, setNewCatInput] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchRef = useRef();
  fetchRef.current = async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedBullets = polishData?.bullets
        ? polishData.bullets.map(b => ({ id: b.id, text: b.text }))
        : (selectionData?.selectedBullets || []);

      const result = await recommendSkills({
        resumeData,
        selectedBullets,
        jobDescription: jdData.jobDescription,
        targetRole: jdData.targetRole,
      });
      setSkills(result.skills.map((s, i) => ({
        id: `skill-${i}-${Date.now()}`,
        category: s.category,
        items: [...s.items],
      })));
    } catch (e) {
      setError(e.message);
      // Fall back to original resume skills
      setSkills(buildFromResumeData(resumeData));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) fetchRef.current();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    setSkills(prev => {
      const ids = prev.map(s => s.id);
      return arrayMove(prev, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    });
  }

  function updateName(id, name) {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, category: name } : s));
  }

  function addItem(id, item) {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, items: [...s.items, item] } : s));
  }

  function removeItem(id, item) {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, items: s.items.filter(i => i !== item) } : s));
  }

  function toggleItem(id, item) {
    setSkills(prev => prev.map(s => {
      if (s.id !== id) return s;
      return s.items.includes(item)
        ? { ...s, items: s.items.filter(i => i !== item) }
        : { ...s, items: [...s.items, item] };
    }));
  }

  function addCategory(e) {
    e.preventDefault();
    const name = newCatInput.trim();
    if (!name) return;
    setSkills(prev => [...prev, { id: `skill-custom-${Date.now()}`, category: name, items: [] }]);
    setNewCatInput('');
  }

  function removeCategory(id) {
    setSkills(prev => prev.filter(s => s.id !== id));
  }

  function handleContinue() {
    onComplete({
      skills: skills.map(s => ({ category: s.category, items: s.items })),
    });
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-zinc-100 mb-8">Skills</h2>
        <div className="flex flex-col items-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-300 font-medium">Recommending skills…</p>
          <p className="text-zinc-500 text-sm text-center max-w-xs">
            Claude is selecting and grouping skills based on your experience and the JD.
          </p>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-100">Skills</h2>
        <p className="text-zinc-500 mt-1 text-sm">
          Claude recommended these skill groups. Drag to reorder, click category name to rename, add or remove skills.
        </p>
        {error && (
          <p className="mt-2 text-xs text-amber-600">
            Claude suggestion failed — showing your original skills instead. You can re-try:
            <button onClick={() => fetchRef.current()} className="underline ml-1">retry</button>
          </p>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={skills.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {skills.map(cat => (
              <div key={cat.id} className="relative group">
                <SortableCategory
                  cat={cat}
                  onToggleItem={toggleItem}
                  onRemoveItem={removeItem}
                  onAddItem={addItem}
                  onUpdateName={updateName}
                />
                <button
                  onClick={() => removeCategory(cat.id)}
                  className="absolute top-3 right-3 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove category"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add category */}
      <form onSubmit={addCategory} className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-700">
        <input
          type="text"
          value={newCatInput}
          onChange={e => setNewCatInput(e.target.value)}
          placeholder="New category name…"
          className="flex-1 text-sm border border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!newCatInput.trim()}
          className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700 font-medium disabled:opacity-40"
        >
          + Add Category
        </button>
      </form>

      <div className="flex items-center justify-between mt-6 pt-5 border-t border-zinc-700">
        <button onClick={onBack} className="text-sm text-zinc-500 hover:text-zinc-300 font-medium">
          ← Back
        </button>
        <button
          onClick={handleContinue}
          disabled={skills.every(s => s.items.length === 0)}
          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          Preview & Export →
        </button>
      </div>
    </div>
  );
}
