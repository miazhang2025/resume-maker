import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

function formatDate(str) {
  if (!str || str === 'Present') return 'Present';
  const [year, month] = str.split('-');
  return new Date(year, (month || 1) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function buildStyles(themeColor, base) {
  return StyleSheet.create({
    page: { paddingVertical: 38, paddingHorizontal: 48, fontSize: base, fontFamily: 'Helvetica', color: '#1f2937', backgroundColor: '#ffffff' },
    name: { fontSize: base + 11, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 3 },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', fontSize: base - 1, color: '#6b7280', marginBottom: 14 },
    contactSep: { marginHorizontal: 4, color: '#d1d5db' },
    sectionTitle: { fontSize: base - 1.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1.2, color: themeColor, borderBottomWidth: 0.75, borderBottomColor: themeColor, paddingBottom: 3, marginTop: 14, marginBottom: 7 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    entryCompany: { fontFamily: 'Helvetica-Bold', fontSize: base },
    entryDate: { fontSize: base - 1, color: '#6b7280' },
    entryRole: { fontSize: base - 0.5, color: '#4b5563', fontFamily: 'Helvetica-Oblique', marginBottom: 3 },
    bulletRow: { flexDirection: 'row', marginBottom: 2, paddingLeft: 6 },
    bulletDot: { width: 8, fontSize: base - 0.5, color: themeColor, marginTop: 0.5 },
    bulletText: { flex: 1, fontSize: base - 0.5, lineHeight: 1.45, color: '#374151' },
    entryGroup: { marginBottom: 9 },
    eduDegree: { fontSize: base - 0.5, color: '#4b5563', marginTop: 1, marginBottom: 6 },
    skillRow: { flexDirection: 'row', marginBottom: 3.5 },
    skillLabel: { fontFamily: 'Helvetica-Bold', fontSize: base - 0.5, color: '#374151', width: 105 },
    skillVal: { flex: 1, fontSize: base - 0.5, color: '#4b5563', lineHeight: 1.4 },
  });
}

function ContactItem({ value, children }) {
  if (!value) return null;
  return children;
}

export default function ResumePDF({ resumeData, selectionData, polishData, skillsData, themeColor, pageSize, density }) {
  const base = density === 'compact' ? 9 : 10;
  const S = buildStyles(themeColor, base);
  const p = resumeData.personal;

  // Build ordered sections from selectionData
  const selectedSet = new Set(selectionData?.selected || []);
  const bulletMap = polishData?.bulletMap || {};

  const expSections = (selectionData?.sections || [])
    .filter(s => s.type === 'experience')
    .map(s => ({ ...s, bullets: s.bullets.filter(b => selectedSet.has(b.id)).map(b => ({ ...b, displayText: bulletMap[b.id] || b.text })) }))
    .filter(s => s.bullets.length > 0);

  const projSections = (selectionData?.sections || [])
    .filter(s => s.type === 'project')
    .map(s => ({ ...s, bullets: s.bullets.filter(b => selectedSet.has(b.id)).map(b => ({ ...b, displayText: bulletMap[b.id] || b.text })) }))
    .filter(s => s.bullets.length > 0);

  const finalSkills = skillsData?.skills || resumeData.skills || [];

  const contactParts = [
    p.email, p.phone, p.location, p.website, p.linkedin, p.github,
  ].filter(Boolean);

  return (
    <Document>
      <Page size={pageSize === 'letter' ? 'LETTER' : 'A4'} style={S.page}>
        {/* ── Header ── */}
        <Text style={S.name}>{p.name}</Text>
        <View style={S.contactRow}>
          {contactParts.map((part, i) => (
            <View key={i} style={{ flexDirection: 'row' }}>
              {i > 0 && <Text style={S.contactSep}>·</Text>}
              <Text>{part}</Text>
            </View>
          ))}
        </View>

        {/* ── Education ── */}
        {resumeData.education?.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Education</Text>
            {resumeData.education.map((edu, i) => (
              <View key={i} style={S.entryGroup}>
                <View style={S.row}>
                  <Text style={S.entryCompany}>{edu.school}</Text>
                  <Text style={S.entryDate}>{formatDate(edu.start)} – {formatDate(edu.end)}</Text>
                </View>
                <Text style={S.eduDegree}>
                  {edu.degree}{edu.honors ? `, ${edu.honors}` : ''}{edu.gpa ? `  ·  GPA: ${edu.gpa}` : ''}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* ── Experience ── */}
        {expSections.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Professional Experience</Text>
            {expSections.map(sec => (
              <View key={sec.id} style={S.entryGroup}>
                <View style={S.row}>
                  <Text style={S.entryCompany}>{sec.company}</Text>
                  <Text style={S.entryDate}>{formatDate(sec.start)} – {formatDate(sec.end)}</Text>
                </View>
                <Text style={S.entryRole}>{sec.role}</Text>
                {sec.bullets.map(b => (
                  <View key={b.id} style={S.bulletRow}>
                    <Text style={S.bulletDot}>•</Text>
                    <Text style={S.bulletText}>{b.displayText}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {/* ── Projects ── */}
        {projSections.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Projects</Text>
            {projSections.map(sec => (
              <View key={sec.id} style={S.entryGroup}>
                <View style={S.row}>
                  <Text style={S.entryCompany}>{sec.name}</Text>
                  <Text style={S.entryDate}>{formatDate(sec.start)} – {formatDate(sec.end)}</Text>
                </View>
                {sec.role && (
                  <Text style={S.entryRole}>{sec.role}</Text>
                )}
                {sec.bullets.map(b => (
                  <View key={b.id} style={S.bulletRow}>
                    <Text style={S.bulletDot}>•</Text>
                    <Text style={S.bulletText}>{b.displayText}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {/* ── Skills ── */}
        {finalSkills.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Skills</Text>
            {finalSkills.filter(s => s.items?.length > 0).map((s, i) => (
              <View key={i} style={S.skillRow}>
                <Text style={S.skillLabel}>{s.category}:</Text>
                <Text style={S.skillVal}>{s.items.join(', ')}</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
