import { useState, useRef } from 'react';
import { downloadSampleJson } from '../../utils/sampleData';

function ValidationError({ errors }) {
  if (!errors.length) return null;
  return (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-700 text-sm font-medium mb-1">Invalid JSON structure:</p>
      <ul className="text-red-600 text-xs list-disc list-inside space-y-0.5">
        {errors.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </div>
  );
}

function validateSchema(data) {
  const errors = [];

  if (!data.personal || typeof data.personal !== 'object') {
    errors.push('Missing "personal" object (name, email, etc.)');
  } else {
    if (!data.personal.name) errors.push('"personal.name" is required');
    if (!data.personal.email) errors.push('"personal.email" is required');
  }

  if (!Array.isArray(data.education)) errors.push('"education" must be an array');
  if (!Array.isArray(data.experience)) errors.push('"experience" must be an array');
  if (!Array.isArray(data.projects)) errors.push('"projects" must be an array');
  if (!Array.isArray(data.skills)) errors.push('"skills" must be an array');

  for (const exp of (data.experience || [])) {
    if (!Array.isArray(exp.bullets)) {
      errors.push(`Experience "${exp.company || '?'}" must have a "bullets" array`);
    } else {
      for (const b of exp.bullets) {
        if (!b.id) errors.push(`Bullet in "${exp.company}" is missing an "id"`);
        if (!b.text) errors.push(`Bullet ${b.id || '?'} in "${exp.company}" is missing "text"`);
      }
    }
  }

  for (const proj of (data.projects || [])) {
    if (!proj.name) errors.push(`A project entry (id: "${proj.id || '?'}") is missing a "name" field`);
    if (!Array.isArray(proj.bullets)) {
      errors.push(`Project "${proj.name || proj.id || '?'}" must have a "bullets" array`);
    } else {
      for (const b of proj.bullets) {
        if (!b.id) errors.push(`Bullet in project "${proj.name || '?'}" is missing an "id"`);
        if (!b.text) errors.push(`Bullet ${b.id || '?'} in project "${proj.name || '?'}" is missing "text"`);
      }
    }
  }

  return errors;
}

function PersonalPreview({ data }) {
  const { personal, education, experience, projects, skills } = data;
  return (
    <div className="mt-6 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="bg-zinc-900 border-b border-zinc-700 px-4 py-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-sm font-medium text-zinc-300">Resume loaded successfully</span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold text-zinc-100 text-base">{personal.name}</p>
          <p className="text-zinc-500">{personal.email}</p>
          {personal.location && <p className="text-zinc-500">{personal.location}</p>}
        </div>
        <div className="space-y-1 text-zinc-400">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Education</span>
            <span className="font-medium">{education.length} entry</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Experience</span>
            <span className="font-medium">{experience.length} roles ({experience.flatMap(e => e.bullets).length} bullets)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Projects</span>
            <span className="font-medium">{projects.length} projects ({projects.flatMap(p => p.bullets).length} bullets)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Skill categories</span>
            <span className="font-medium">{skills.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Step1Upload({ onComplete, initialData }) {
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState([]);
  const [parsedData, setParsedData] = useState(initialData || null);
  const fileInputRef = useRef();

  function handleFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setErrors(['Please upload a .json file.']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const errs = validateSchema(data);
        if (errs.length) {
          setErrors(errs);
          setParsedData(null);
        } else {
          setErrors([]);
          setParsedData(data);
        }
      } catch {
        setErrors(['Invalid JSON file. Please check the format.']);
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-100">Upload Your Resume Data</h2>
        <p className="text-zinc-500 mt-1 text-sm">
          Upload a JSON file with your resume data. We'll use it to tailor bullets for your target job.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-red-600 bg-red-950/40' : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-zinc-300 font-medium">Drop your JSON file here</p>
            <p className="text-zinc-500 text-sm mt-0.5">or click to browse</p>
          </div>
        </div>
      </div>

      <ValidationError errors={errors} />

      {parsedData && <PersonalPreview data={parsedData} />}

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={downloadSampleJson}
          className="text-sm text-red-400 hover:text-red-400 flex items-center gap-1.5 font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download sample JSON
        </button>

        <button
          onClick={() => parsedData && onComplete(parsedData)}
          disabled={!parsedData}
          className={`
            px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
            ${parsedData
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }
          `}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
