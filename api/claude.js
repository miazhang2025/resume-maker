// Vercel serverless function. Runs on the server, so ANTHROPIC_API_KEY never
// reaches the browser — this is the whole reason the module exists.
//
// The endpoint takes a named task, not a raw prompt. Prompts and token limits
// live here rather than in the client so the endpoint can only ever run the
// seven operations this app needs.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-8';

export const config = { maxDuration: 60 };

async function callClaude({ system, user, content, maxTokens }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set on the server');

  // `content` (an array of content blocks, e.g. a PDF document) takes
  // precedence over a plain `user` string.
  const userContent = content ?? user;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
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

// Shared schema description so PDF parsing and gap-filling stay in sync.
const RESUME_SCHEMA = `{
  "personal": { "name": "", "email": "", "phone": "", "location": "", "website": "", "linkedin": "", "github": "" },
  "education": [ { "id": "edu1", "school": "", "degree": "", "start": "YYYY-MM", "end": "YYYY-MM", "gpa": "", "honors": "" } ],
  "experience": [ { "id": "exp1", "company": "", "role": "", "start": "YYYY-MM", "end": "YYYY-MM or Present", "tags": [], "bullets": [ { "id": "exp1-b1", "text": "", "tags": [] } ] } ],
  "projects": [ { "id": "proj1", "name": "", "role": "", "start": "YYYY-MM", "end": "YYYY-MM", "tags": [], "bullets": [ { "id": "proj1-b1", "text": "", "tags": [] } ] } ],
  "skills": [ { "id": "skill1", "category": "", "items": [] } ]
}`;

const REQUIRED_RULE = `Mark required=true ONLY for: full name, email, at least one work experience or project, and at least one education entry. Everything else is required=false.`;

// Each task maps a payload from the client to a Claude request. Adding a task
// here is what makes it callable — the client cannot invoke anything else.
const TASKS = {
  // Parse an uploaded résumé PDF (base64) into the app's JSON template, plus a
  // list of questions about information that is missing or unclear.
  parseResumePdf({ base64, mediaType = 'application/pdf' }) {
    const system = `You convert a candidate's résumé (provided as a PDF) into a strict JSON object the app uses.
Return ONLY valid JSON — no markdown, no commentary.

Use EXACTLY this schema:
${RESUME_SCHEMA}

Rules:
- Extract everything present in the PDF and preserve the original bullet wording.
- Generate ids exactly like the examples (edu1, exp1, exp1-b1, proj1, proj1-b1, skill1...). Every bullet MUST have a unique id and non-empty text.
- Infer reasonable lowercase tags for each experience/project and bullet from its content.
- Dates as YYYY-MM. Use "Present" for current roles. If a date is unknown, use "".
- For any field you genuinely cannot find, use "" (empty string) — NEVER invent data.
- Then produce a "missing" array listing the important information that is absent or unclear and should be asked of the user. Each item: { "field": "<dot.path>", "question": "<a clear, friendly question>", "required": true|false }.
${REQUIRED_RULE} If nothing is missing, use an empty array.

Respond with this exact shape:
{ "resume": ${RESUME_SCHEMA.replace(/\n/g, ' ')}, "missing": [] }`;

    const content = [
      { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } },
      { type: 'text', text: 'Convert this résumé PDF into the JSON described in your instructions.' },
    ];

    return { system, content, maxTokens: 8000 };
  },

  // Merge the user's answers to the missing-info questions back into the résumé,
  // then re-evaluate what (if anything) is still missing.
  fillResumeGaps({ resume, answers }) {
    const system = `You maintain a candidate's résumé JSON (same schema below). The user has answered questions to fill in missing information.
Integrate their answers into the résumé, restructuring as needed (e.g. adding experience, education, project or skill entries with proper ids). Keep ALL existing data; only add or correct.
Generate ids for any new entries/bullets following the pattern (exp2, exp2-b1, edu2, proj2, skill2...).
Re-evaluate what is still missing afterwards; drop anything the user has now provided.
${REQUIRED_RULE}
Return ONLY valid JSON, no markdown, with this shape:
{ "resume": <full updated résumé matching the schema>, "missing": [ { "field": "<dot.path>", "question": "<question>", "required": true|false } ] }

Schema:
${RESUME_SCHEMA}`;

    const user = `Current résumé JSON:
${JSON.stringify(resume)}

The user's answers:
${answers.map(a => `Q: ${a.question}\nA: ${a.answer?.trim() ? a.answer.trim() : '(skipped)'}`).join('\n\n')}`;

    return { system, user, maxTokens: 8000 };
  },

  scoreRelevance({ resumeData, jobDescription, targetRole }) {
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

    return { system, user, maxTokens: 2000 };
  },

  polishBullets({ bullets, jobDescription, targetRole, feedback }) {
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

    return { system, user, maxTokens: 2000 };
  },

  rephraseSingleBullet({ bullet, jobDescription, feedback }) {
    const system = `You are a professional resume writer. Rewrite a single resume bullet point.
Return ONLY valid JSON, no markdown, no explanation.
Format: { "text": "<rewritten bullet>" }`;

    const user = `Job Description context:
${jobDescription}

Original bullet: ${bullet.text}
${feedback ? `User feedback: ${feedback}` : ''}`;

    return { system, user, maxTokens: 300 };
  },

  recommendSkills({ resumeData, selectedBullets, jobDescription, targetRole }) {
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

    return { system, user, maxTokens: 800 };
  },

  generateCoverLetter({ resumeData, jobDescription, targetRole, selectedBullets }) {
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

    return { system, user, maxTokens: 1000 };
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { task, payload } = req.body ?? {};

  if (!Object.prototype.hasOwnProperty.call(TASKS, task)) {
    return res.status(400).json({ error: `Unknown task: ${task}` });
  }
  if (payload === null || typeof payload !== 'object') {
    return res.status(400).json({ error: 'payload must be an object' });
  }

  try {
    const result = await callClaude(TASKS[task](payload));
    return res.status(200).json(result);
  } catch (err) {
    // The message can carry Anthropic's error text, which is safe to surface —
    // it never contains the key.
    console.error(`[api/claude] task=${task}:`, err);
    return res.status(502).json({ error: err.message || 'Request failed' });
  }
}
