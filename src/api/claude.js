// Thin client for /api/claude. The prompts, the model, the token limits and
// the API key all live in the serverless function (api/claude.js) — nothing
// here reaches Anthropic directly, so nothing here can leak a credential.
//
// Exported signatures are unchanged from when this module called Anthropic
// itself, so callers do not need to know the difference.

const ENDPOINT = '/api/claude';

async function runTask(task, payload) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, payload }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

export function parseResumePdf({ base64, mediaType = 'application/pdf' }) {
  return runTask('parseResumePdf', { base64, mediaType });
}

export function fillResumeGaps({ resume, answers }) {
  return runTask('fillResumeGaps', { resume, answers });
}

export function scoreRelevance({ resumeData, jobDescription, targetRole }) {
  return runTask('scoreRelevance', { resumeData, jobDescription, targetRole });
}

export function polishBullets({ bullets, jobDescription, targetRole, feedback }) {
  return runTask('polishBullets', { bullets, jobDescription, targetRole, feedback });
}

export function rephraseSingleBullet({ bullet, jobDescription, feedback }) {
  return runTask('rephraseSingleBullet', { bullet, jobDescription, feedback });
}

export function recommendSkills({ resumeData, selectedBullets, jobDescription, targetRole }) {
  return runTask('recommendSkills', { resumeData, selectedBullets, jobDescription, targetRole });
}

export function generateCoverLetter({ resumeData, jobDescription, targetRole, selectedBullets }) {
  return runTask('generateCoverLetter', { resumeData, jobDescription, targetRole, selectedBullets });
}
