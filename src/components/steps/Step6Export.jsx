import { useState, useCallback } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import ResumePDF from '../ResumePDF';
import { generateCoverLetter } from '../../api/claude';
import RansomText from '../RansomText';

const PRESETS = [
  { label: 'Charcoal', value: '#1f2937' },
  { label: 'Rose', value: '#be123c' },
  { label: 'Slate', value: '#334155' },
  { label: 'Forest', value: '#14532d' },
  { label: 'Indigo', value: '#3730a3' },
  { label: 'Amber', value: '#92400e' },
];

function CoverLetterModal({ onClose, resumeData, jdData, selectionData, polishData }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const selectedBullets = polishData?.bullets
        ? polishData.bullets.map(b => ({ text: b.text }))
        : (selectionData?.selectedBullets || []);
      const result = await generateCoverLetter({
        resumeData,
        jobDescription: jdData.jobDescription,
        targetRole: jdData.targetRole,
        selectedBullets,
      });
      setText(result.coverLetter);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <h3 className="text-lg font-bold text-zinc-100">Cover Letter</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!text && !loading && (
            <div className="flex flex-col items-center py-12 gap-4">
              <p className="text-zinc-500 text-sm text-center max-w-xs">
                Claude will write a tailored cover letter based on your experience and the job description.
              </p>
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
              <button
                onClick={generate}
                className="px-5 py-2.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium"
              >
                Generate Cover Letter
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm">Writing your cover letter…</p>
            </div>
          )}

          {text && (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={18}
              className="w-full text-sm text-zinc-200 leading-relaxed border border-zinc-700 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 font-serif"
            />
          )}
        </div>

        {text && (
          <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-700">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-zinc-700 rounded-lg hover:bg-zinc-900 font-medium text-zinc-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copied!' : 'Copy text'}
            </button>
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 font-medium"
            >
              ↺ Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ControlPanel({ themeColor, setThemeColor, pageSize, setPageSize, density, setDensity, onCoverLetter, pdfProps }) {
  return (
    <div className="w-64 shrink-0 space-y-6">
      {/* Color */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Accent Color</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setThemeColor(p.value)}
              title={p.label}
              className={`h-8 rounded-lg border-2 transition-all ${themeColor === p.value ? 'border-gray-800 scale-105' : 'border-transparent hover:border-zinc-600'}`}
              style={{ backgroundColor: p.value }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={themeColor}
            onChange={e => setThemeColor(e.target.value)}
            className="w-8 h-8 rounded border border-zinc-700 cursor-pointer p-0.5"
          />
          <span className="text-xs text-zinc-500 font-mono">{themeColor}</span>
        </div>
      </div>

      {/* Paper Size */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Paper Size</p>
        <div className="flex gap-2">
          {[['a4', 'A4'], ['letter', 'US Letter']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPageSize(val)}
              className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-colors ${
                pageSize === val
                  ? 'bg-red-700 text-white border-red-700'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Density */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Page Density</p>
        <div className="flex gap-2">
          {[['standard', 'Standard'], ['compact', 'Compact']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setDensity(val)}
              className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-colors ${
                density === val
                  ? 'bg-red-700 text-white border-red-700'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-1.5">
          {density === 'compact' ? 'Smaller font, tighter spacing — fits more on one page.' : 'Standard 10pt font.'}
        </p>
      </div>

      {/* Export */}
      <div className="space-y-2 pt-2">
        <PDFDownloadLink
          document={<ResumePDF {...pdfProps} />}
          fileName={`resume-${(pdfProps.resumeData?.personal?.name || 'export').replace(/\s+/g, '-').toLowerCase()}.pdf`}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium"
        >
          {({ loading }) => loading ? 'Preparing…' : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </>
          )}
        </PDFDownloadLink>

        <button
          onClick={onCoverLetter}
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-zinc-700 text-zinc-300 text-sm rounded-lg hover:bg-zinc-900 font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Generate Cover Letter
        </button>
      </div>
    </div>
  );
}

export default function Step6Export({ onBack, resumeData, jdData, selectionData, polishData, skillsData }) {
  const [themeColor, setThemeColor] = useState('#1f2937');
  const [pageSize, setPageSize] = useState('a4');
  const [density, setDensity] = useState('standard');
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  const pdfProps = { resumeData, selectionData, polishData, skillsData, themeColor, pageSize, density };
  // key forces PDFViewer to re-render when settings change
  const viewerKey = `${themeColor}-${pageSize}-${density}`;

  return (
    <div className="flex gap-8 min-h-[calc(100vh-80px)]">
      {/* Left controls */}
      <div className="shrink-0">
        <div className="mb-6">
          <RansomText text="Export PDF" className="text-3xl" />
          <p className="text-zinc-500 mt-1 text-sm">Customize the look, then download.</p>
        </div>
        <ControlPanel
          themeColor={themeColor}
          setThemeColor={setThemeColor}
          pageSize={pageSize}
          setPageSize={setPageSize}
          density={density}
          setDensity={setDensity}
          onCoverLetter={() => setShowCoverLetter(true)}
          pdfProps={pdfProps}
        />
        <button onClick={onBack} className="mt-6 text-sm text-zinc-500 hover:text-zinc-400 font-medium">
          ← Back
        </button>
      </div>

      {/* Right: PDF preview */}
      <div className="flex-1 min-w-0">
        <div className="sticky top-6">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Preview</p>
          <div className="rounded-xl overflow-hidden border border-zinc-700 shadow-sm bg-zinc-800" style={{ height: 'calc(100vh - 140px)' }}>
            <PDFViewer key={viewerKey} width="100%" height="100%" showToolbar={false}>
              <ResumePDF {...pdfProps} />
            </PDFViewer>
          </div>
        </div>
      </div>

      {showCoverLetter && (
        <CoverLetterModal
          onClose={() => setShowCoverLetter(false)}
          resumeData={resumeData}
          jdData={jdData}
          selectionData={selectionData}
          polishData={polishData}
        />
      )}
    </div>
  );
}
