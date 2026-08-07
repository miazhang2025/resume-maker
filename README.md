# Fk Resume

An AI-powered resume builder that tailors your resume to any job description using Claude. Upload your experience once, paste a job posting, and get a polished, targeted resume in minutes.

![Dark mode UI with dark grey and red accent](https://img.shields.io/badge/UI-Dark%20Mode-18181b?style=flat&labelColor=18181b&color=dc2626)
![Built with React](https://img.shields.io/badge/React-Vite-61dafb?style=flat&logo=react)
![Powered by Claude](https://img.shields.io/badge/AI-Claude%20Opus%204.8-cc785c?style=flat)

---

## What it does

Most resumes are written once and sent everywhere. This tool flips that — you maintain one master JSON file with all your experience, and the app uses Claude to select, rewrite, and format the most relevant content for each specific job you apply to.

### Six-step workflow

**1. Upload Resume Data**
Upload a JSON file containing your full work history — experience, projects, education, and skills. A sample JSON is provided to show the expected format. Every bullet point gets a unique ID so the AI can track and rewrite individual items.

**2. Paste Job Description**
Paste the full job posting and optionally specify the target role title. This is the signal Claude uses for all subsequent AI steps.

**3. AI Bullet Selection**
Claude scores every bullet point in your resume (0–1) for relevance to the job description. High-scoring bullets are pre-selected. You see the relevance score on each bullet, can toggle any on/off, and drag to reorder within sections. Bullets marked **★ AI pick** scored above the recommendation threshold.

**4. Polish Content**
Claude rewrites every selected bullet to better match the job's language, keywords, and framing — while keeping your real achievements intact. For each bullet you can:
- Edit the text directly inline
- Click **Rewrite** to ask Claude for a fresh take
- Undo back through the version history
- Add global feedback and re-polish the entire set at once (e.g. *"make these more concise"*, *"emphasize leadership"*)

**5. Skills**
Claude recommends which skills to include and how to group them, based on the JD and your selected experience. Drag categories to reorder, rename them, add or remove individual skills, and add entirely new categories.

**6. Export PDF**
Live resume preview powered by `@react-pdf/renderer`. Customize:
- **Accent color** — 6 presets or a custom color picker
- **Paper size** — A4 or US Letter
- **Density** — Standard (10pt) or Compact (9pt, fits more on one page)

Download the PDF directly in the browser. Generate a tailored **cover letter** via Claude with one click — editable and copyable.

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable |
| PDF generation | @react-pdf/renderer |
| AI | Anthropic Claude (`claude-opus-4-8`) via a serverless function |

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/miazhang2025/resume-maker.git
cd resume-maker
npm install
```

### 2. Add your API key

Create a `.env.local` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at [console.anthropic.com](https://console.anthropic.com/).

> **The variable name matters.** Vite inlines any `VITE_`-prefixed variable into
> the client bundle as plaintext, so a key named `VITE_ANTHROPIC_API_KEY` would be
> published to anyone who downloads the site's JavaScript. Without the prefix it
> stays on the server and is read only by `api/claude.js`. Do not rename it.

When deploying, set the same un-prefixed `ANTHROPIC_API_KEY` in your host's
environment variables (on Vercel: Settings → Environment Variables).

> **The `/api/claude` endpoint spends your API credits.** It never exposes the
> key, but it is unauthenticated — anyone who can reach the deployed site can run
> the seven résumé tasks on your account. Keep the deployment behind access
> control (on Vercel: Settings → Deployment Protection, scoped to *all*
> deployments, not previews only), or add your own auth check to the handler.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Resume JSON format

Download a full example from the app (Step 1 → *Download sample JSON*), or follow this schema:

```json
{
  "personal": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1 (555) 123-4567",
    "location": "San Francisco, CA",
    "website": "janedoe.dev",
    "linkedin": "linkedin.com/in/janedoe",
    "github": "github.com/janedoe"
  },
  "education": [
    {
      "id": "edu1",
      "school": "UC Berkeley",
      "degree": "B.S. Computer Science",
      "start": "2018-08",
      "end": "2022-05",
      "gpa": "3.8",
      "honors": "Magna Cum Laude"
    }
  ],
  "experience": [
    {
      "id": "exp1",
      "company": "Tech Corp",
      "role": "Senior Software Engineer",
      "start": "2022-06",
      "end": "Present",
      "tags": ["backend", "python", "aws"],
      "bullets": [
        {
          "id": "exp1-b1",
          "text": "Built scalable microservices handling 2M+ daily requests...",
          "tags": ["backend", "scalability"]
        }
      ]
    }
  ],
  "projects": [
    {
      "id": "proj1",
      "name": "AI Resume Builder",
      "role": "Full-Stack Developer",
      "start": "2024-01",
      "end": "2024-04",
      "tags": ["react", "ai"],
      "bullets": [
        {
          "id": "proj1-b1",
          "text": "Built an AI-powered resume tailoring tool...",
          "tags": ["react", "frontend"]
        }
      ]
    }
  ],
  "skills": [
    {
      "id": "skill1",
      "category": "Languages",
      "items": ["Python", "JavaScript", "Go"]
    }
  ]
}
```

**Key rules:**
- Every `bullet` needs a unique `id` — this is how Claude tracks and rewrites individual items
- `experience` uses `company` + `role`; `projects` use `name` + `role`
- `tags` on bullets help with organization but are optional
- Dates use `"YYYY-MM"` format; use `"Present"` for current roles

---

## Project structure

```
api/
└── claude.js               # Serverless function: prompts, model, API key (server-only)

src/
├── api/
│   └── claude.js          # Thin fetch client for /api/claude — no key, no prompts
├── components/
│   ├── Sidebar.jsx         # Step navigation
│   ├── ResumePDF.jsx       # PDF document component (@react-pdf/renderer)
│   └── steps/
│       ├── Step1Upload.jsx
│       ├── Step2JDInput.jsx
│       ├── Step3Selection.jsx
│       ├── Step4Polish.jsx
│       ├── Step5Skills.jsx
│       └── Step6Export.jsx
├── utils/
│   └── sampleData.js       # Sample resume JSON + download helper
├── App.jsx
└── index.css
```
