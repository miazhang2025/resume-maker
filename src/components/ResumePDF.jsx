import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';

// Keep words intact — the default hyphenator chops names/tech terms mid-word.
Font.registerHyphenationCallback(word => [word]);

function formatDate(str) {
  if (!str || str === 'Present') return 'Present';
  const [year, month] = str.split('-');
  return new Date(year, (month || 1) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Blend a hex color toward white — used for the soft rules under section titles.
function tint(hex, amount) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  const mix = c => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const PAGE_DIMS = {
  a4: { w: 595.28, h: 841.89 },
  letter: { w: 612, h: 792 },
};

const PAD_X = 46;
const PAD_Y = 40;

/* ────────────────────────────────────────────────────────────────
   Fit engine
   react-pdf can't measure text before layout, so we estimate height
   with Helvetica's average glyph width (~0.5em) and search for the
   largest font size whose estimated content still fits one page.
   Leftover space is then spread back into the gaps so the page
   reads as full rather than top-heavy.
   ──────────────────────────────────────────────────────────────── */

function linesFor(text, width, fontSize) {
  const charsPerLine = Math.max(12, Math.floor(width / (fontSize * 0.503)));
  return Math.max(1, Math.ceil((text || '').length / charsPerLine));
}

// Width of the skills label column — sized to the longest category so it
// never wraps onto a second line.
function skillLabelWidth(skills, f) {
  const longest = skills.reduce((m, s) => Math.max(m, (s.category || '').length), 0);
  return Math.min(160, Math.max(72, longest * f * 0.56 + 10));
}

function estimateHeight(model, f, k, contentW) {
  const bulletW = contentW - 6 - 9;
  let h = 0;

  // Header
  h += (f + 12) * 1.16;
  h += linesFor(model.contactLine, contentW, f - 1.2) * (f - 1.2) * 1.32;
  h += 9 * k + 1.2;

  const sectionBlock = () => (f - 1.6) * 1.2 + 3 + 0.8 + 13 * k + 6 * k;

  if (model.education.length) {
    h += sectionBlock();
    model.education.forEach(e => {
      h += (f + 0.5) * 1.26;
      h += linesFor(e.line, contentW, f - 0.5) * (f - 0.5) * 1.34;
      h += 6 * k;
    });
  }

  const entryList = list => {
    h += sectionBlock();
    list.forEach(sec => {
      h += (f + 0.5) * 1.26;
      if (sec.role) h += (f - 0.5) * 1.28 + 2 * k;
      sec.bullets.forEach(b => {
        h += linesFor(b.displayText, bulletW, f - 0.5) * (f - 0.5) * 1.34 + 2.2 * k;
      });
      h += 8 * k;
    });
  };

  if (model.experience.length) entryList(model.experience);
  if (model.projects.length) entryList(model.projects);

  if (model.skills.length) {
    h += sectionBlock();
    const labelW = skillLabelWidth(model.skills, f);
    model.skills.forEach(s => {
      h += linesFor(s.items.join(', '), contentW - labelW - 6, f - 0.5) * (f - 0.5) * 1.36 + 3.5 * k;
    });
  }

  return h;
}

// Spacing multiplier tracks the font size so margins scale with type.
const spacingFor = f => Math.min(1.18, Math.max(0.82, f / 10));

function countGaps(model) {
  let sections = 0, entries = 0;
  if (model.education.length) { sections++; entries += model.education.length; }
  if (model.experience.length) { sections++; entries += model.experience.length; }
  if (model.projects.length) { sections++; entries += model.projects.length; }
  if (model.skills.length) { sections++; }
  return { sections, entries };
}

function solveLayout(model, pageSize, density) {
  const dims = PAGE_DIMS[pageSize === 'letter' ? 'letter' : 'a4'];
  const contentW = dims.w - PAD_X * 2;
  const availableH = dims.h - PAD_Y * 2;

  // Estimating by average glyph width always runs a little long; measured
  // against real renders it overshoots by roughly this much.
  const CAL = 1.05;
  const fits = (f, k) => estimateHeight(model, f, k, contentW) / CAL <= availableH;

  let base;
  if (density === 'standard') base = 10;
  else if (density === 'compact') base = 9;
  else {
    base = 8.2;
    for (let f = 11.2; f >= 8.2; f -= 0.1) {
      if (fits(f, spacingFor(f))) { base = f; break; }
    }
  }

  const k = spacingFor(base);
  const used = estimateHeight(model, base, k, contentW) / CAL;
  const leftover = availableH - used;

  // Spread the remaining room across section + entry gaps, holding some back
  // so an under-estimate never spills onto a second page.
  const { sections, entries } = countGaps(model);
  const slots = sections * 2 + entries;
  const extra = slots > 0 && leftover > 0 ? Math.min((leftover * 0.65) / slots, 12) : 0;

  return { base, k, extra, labelW: skillLabelWidth(model.skills, base) };
}

/* ──────────────────────────────── styles ─────────────────────────────── */

function buildStyles(themeColor, f, k, extra, labelW) {
  const rule = tint(themeColor, 0.62);
  return StyleSheet.create({
    page: {
      paddingVertical: PAD_Y,
      paddingHorizontal: PAD_X,
      fontSize: f,
      fontFamily: 'Helvetica',
      color: '#1f2937',
      backgroundColor: '#ffffff',
    },

    header: {
      borderBottomWidth: 1.2,
      borderBottomColor: themeColor,
      paddingBottom: 6 * k,
      marginBottom: 3 * k + extra,
    },
    name: {
      fontSize: f + 12,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', fontSize: f - 1.2, color: '#64748b' },
    contactSep: { marginHorizontal: 4.5, color: tint(themeColor, 0.4) },

    sectionTitle: {
      fontSize: f - 1.6,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: themeColor,
      borderBottomWidth: 0.8,
      borderBottomColor: rule,
      paddingBottom: 3,
      marginTop: 10 * k + extra,
      marginBottom: 6 * k + extra * 0.5,
    },

    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    entryCompany: { fontFamily: 'Helvetica-Bold', fontSize: f + 0.5, color: '#0f172a' },
    entryDate: { fontSize: f - 1.4, color: '#64748b', letterSpacing: 0.2 },
    entryRole: {
      fontSize: f - 0.5,
      color: '#475569',
      fontFamily: 'Helvetica-Oblique',
      marginTop: 1,
      marginBottom: 2 * k,
    },
    entryGroup: { marginBottom: 7 * k + extra },

    bulletRow: { flexDirection: 'row', marginBottom: 2.2 * k },
    bulletDot: { width: 9, paddingLeft: 2, fontSize: f - 2, color: themeColor, marginTop: f * 0.28 },
    bulletText: { flex: 1, fontSize: f - 0.5, lineHeight: 1.34, color: '#334155' },

    eduDegree: { fontSize: f - 0.5, color: '#475569', lineHeight: 1.34, marginTop: 1.5 },

    skillRow: { flexDirection: 'row', marginBottom: 3.5 * k },
    skillLabel: {
      fontFamily: 'Helvetica-Bold',
      fontSize: f - 0.5,
      color: '#0f172a',
      width: labelW,
      paddingRight: 6,
    },
    skillVal: { flex: 1, fontSize: f - 0.5, color: '#475569', lineHeight: 1.36 },
  });
}

/* ──────────────────────────────── document ───────────────────────────── */

export default function ResumePDF({ resumeData, selectionData, polishData, skillsData, themeColor, pageSize, density }) {
  const p = resumeData.personal;
  const selectedSet = new Set(selectionData?.selected || []);
  const bulletMap = polishData?.bulletMap || {};

  const pickBullets = type => (selectionData?.sections || [])
    .filter(s => s.type === type)
    .map(s => ({
      ...s,
      bullets: s.bullets
        .filter(b => selectedSet.has(b.id))
        .map(b => ({ ...b, displayText: bulletMap[b.id] || b.text })),
    }))
    .filter(s => s.bullets.length > 0);

  const expSections = pickBullets('experience');
  const projSections = pickBullets('project');
  const finalSkills = (skillsData?.skills || resumeData.skills || []).filter(s => s.items?.length > 0);
  const education = resumeData.education || [];

  const contactParts = [p.email, p.phone, p.location, p.website, p.linkedin, p.github].filter(Boolean);

  // Plain-text model the fit engine measures against.
  const model = {
    contactLine: contactParts.join('  ·  '),
    education: education.map(e => ({
      line: `${e.degree}${e.honors ? `, ${e.honors}` : ''}${e.gpa ? `  ·  GPA: ${e.gpa}` : ''}`,
    })),
    experience: expSections,
    projects: projSections,
    skills: finalSkills,
  };

  const { base, k, extra, labelW } = solveLayout(model, pageSize, density);
  const S = buildStyles(themeColor, base, k, extra, labelW);

  const Entry = ({ title, date, role, bullets }) => (
    <View style={S.entryGroup} wrap={false}>
      <View style={S.row}>
        <Text style={S.entryCompany}>{title}</Text>
        <Text style={S.entryDate}>{date}</Text>
      </View>
      {role ? <Text style={S.entryRole}>{role}</Text> : null}
      {bullets.map(b => (
        <View key={b.id} style={S.bulletRow}>
          <Text style={S.bulletDot}>•</Text>
          <Text style={S.bulletText}>{b.displayText}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <Document
      title={`${p.name || 'Resume'} — Resume`}
      author={p.name || ''}
      creator="resume-maker"
      producer="resume-maker"
    >
      <Page size={pageSize === 'letter' ? 'LETTER' : 'A4'} style={S.page}>
        {/* ── Header ── */}
        <View style={S.header}>
          <Text style={S.name}>{p.name}</Text>
          <View style={S.contactRow}>
            {contactParts.map((part, i) => (
              // Separator trails its item so a wrapped line never begins with "·".
              <View key={i} style={{ flexDirection: 'row' }}>
                <Text>{part}</Text>
                {i < contactParts.length - 1 && <Text style={S.contactSep}>·</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* ── Education ── */}
        {education.length > 0 && (
          <View>
            <Text style={S.sectionTitle}>Education</Text>
            {education.map((edu, i) => (
              <View key={i} style={S.entryGroup} wrap={false}>
                <View style={S.row}>
                  <Text style={S.entryCompany}>{edu.school}</Text>
                  <Text style={S.entryDate}>{formatDate(edu.start)} – {formatDate(edu.end)}</Text>
                </View>
                <Text style={S.eduDegree}>
                  {edu.degree}{edu.honors ? `, ${edu.honors}` : ''}{edu.gpa ? `  ·  GPA: ${edu.gpa}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Experience ── */}
        {expSections.length > 0 && (
          <View>
            <Text style={S.sectionTitle}>Professional Experience</Text>
            {expSections.map(sec => (
              <Entry
                key={sec.id}
                title={sec.company}
                date={`${formatDate(sec.start)} – ${formatDate(sec.end)}`}
                role={sec.role}
                bullets={sec.bullets}
              />
            ))}
          </View>
        )}

        {/* ── Projects ── */}
        {projSections.length > 0 && (
          <View>
            <Text style={S.sectionTitle}>Projects</Text>
            {projSections.map(sec => (
              <Entry
                key={sec.id}
                title={sec.name}
                date={`${formatDate(sec.start)} – ${formatDate(sec.end)}`}
                role={sec.role}
                bullets={sec.bullets}
              />
            ))}
          </View>
        )}

        {/* ── Skills ── */}
        {finalSkills.length > 0 && (
          <View>
            <Text style={S.sectionTitle}>Skills</Text>
            {finalSkills.map((s, i) => (
              <View key={i} style={S.skillRow} wrap={false}>
                <Text style={S.skillLabel}>{s.category}</Text>
                <Text style={S.skillVal}>{s.items.join(', ')}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
