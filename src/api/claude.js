const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

async function callClaude({ system, user, maxTokens = 1000 }) {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const raw = data.content[0].text.trim();

  // Strip markdown code fences
  let text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Extract outermost JSON object even if there's surrounding prose
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) text = text.slice(start, end + 1);

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Claude returned non-JSON: ${text.slice(0, 300)}`);
  }
}

export async function scoreRelevance({ resumeData, jobDescription, targetRole }) {
  const system = `You are a resume expert. Analyze bullet points from a resume against a job description and return a relevance score for each bullet.
Return ONLY valid JSON, no markdown, no explanation.
Format: { "scores": [ { "id": "<bullet_id>", "score": <0.0-1.0> } ] }`;

  const user = `Job Description:
${jobDescription}

Target Role: ${targetRole || 'Not specified'}

Resume bullets to score:
${[...resumeData.experience, ...resumeData.projects]
  .flatMap(section =>
    section.bullets.map(b => `- id: ${b.id} | text: ${b.text}`)
  )
  .join('\n')}`;

  return callClaude({ system, user, maxTokens: 2000 });
}

export async function polishBullets({ bullets, jobDescription, targetRole, feedback }) {
  const system = `You are a professional resume writer. Rewrite resume bullet points to better match the given job description.
Keep the same general achievements but use language, keywords, and framing that aligns with the job.
Return ONLY valid JSON, no markdown, no explanation.
Format: { "bullets": [ { "id": "<bullet_id>", "text": "<rewritten text>" } ] }`;

  const user = `Job Description:
${jobDescription}

Target Role: ${targetRole || 'Not specified'}
${feedback ? `\nUser feedback / instructions: ${feedback}\n` : ''}
Bullets to rewrite:
${bullets.map(b => `- id: ${b.id} | original: ${b.text}`).join('\n')}`;

  return callClaude({ system, user, maxTokens: 2000 });
}

export async function rephraseSingleBullet({ bullet, jobDescription, feedback }) {
  const system = `You are a professional resume writer. Rewrite a single resume bullet point.
Return ONLY valid JSON, no markdown, no explanation.
Format: { "text": "<rewritten bullet>" }`;

  const user = `Job Description context:
${jobDescription}

Original bullet: ${bullet.text}
${feedback ? `User feedback: ${feedback}` : ''}`;

  return callClaude({ system, user, maxTokens: 300 });
}

export async function recommendSkills({ resumeData, selectedBullets, jobDescription, targetRole }) {
  const system = `You are a resume expert. Based on the job description and selected experience, recommend which skills to include and how to group them.
Return ONLY valid JSON, no markdown, no explanation.
Format: { "skills": [ { "category": "<name>", "items": ["<skill1>", "<skill2>"] } ] }`;

  const user = `Job Description:
${jobDescription}

Target Role: ${targetRole || 'Not specified'}

Candidate's full skill list:
${resumeData.skills.map(s => `${s.category}: ${s.items.join(', ')}`).join('\n')}

Selected bullets (for context):
${selectedBullets.map(b => b.text).join('\n')}`;

  return callClaude({ system, user, maxTokens: 800 });
}

export async function generateCoverLetter({ resumeData, jobDescription, targetRole, selectedBullets }) {
  const system = `You are a professional cover letter writer. Write a compelling, personalized cover letter.
Keep it to 3-4 paragraphs. Be specific, use real numbers/achievements from the resume.
Return ONLY valid JSON, no markdown code blocks.
Format: { "coverLetter": "<full cover letter text with \\n for line breaks>" }`;

  const user = `Job Description:
${jobDescription}

Target Role: ${targetRole || 'the position'}

Candidate Name: ${resumeData.personal.name}
Key achievements to highlight:
${selectedBullets.slice(0, 6).map(b => `- ${b.text}`).join('\n')}`;

  return callClaude({ system, user, maxTokens: 1000 });
}
