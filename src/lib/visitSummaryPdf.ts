import { jsPDF } from 'jspdf'
import type { VisitSummaryData } from './visitSummaryData'
import { formatWeekRange, getWeekStartISO } from './date'

const MARGIN = 18
const LINE = 5.5

export function downloadVisitSummaryPdf(data: VisitSummaryData) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const maxWidth = pageWidth - MARGIN * 2
  let y = MARGIN

  function ensureSpace(needed: number) {
    const pageHeight = doc.internal.pageSize.getHeight()
    if (y + needed > pageHeight - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  function heading(text: string, size = 13) {
    ensureSpace(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    doc.setTextColor(79, 88, 72)
    doc.text(text, MARGIN, y)
    y += LINE + 2
  }

  function subheading(text: string) {
    ensureSpace(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(79, 88, 72)
    doc.text(text, MARGIN, y)
    y += LINE
  }

  function body(text: string, indent = 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(text, maxWidth - indent) as string[]
    for (const line of lines) {
      ensureSpace(LINE)
      doc.text(line, MARGIN + indent, y)
      y += LINE
    }
    y += 1
  }

  function row(label: string, value: string) {
    ensureSpace(LINE)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(label, MARGIN, y)
    doc.setTextColor(40, 40, 40)
    doc.text(value, MARGIN + 52, y)
    y += LINE
  }

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(79, 88, 72)
  doc.text('The Honest Reset', MARGIN, y)
  y += LINE + 2
  doc.setFontSize(14)
  doc.text('Provider Visit Summary', MARGIN, y)
  y += LINE + 1
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated ${data.generatedDate} · ${data.periodLabel}`, MARGIN, y)
  y += LINE + 4

  heading('Vitals & trends')
  if (data.weightLatest != null) {
    const change =
      data.weightChange30d != null
        ? ` (${data.weightChange30d > 0 ? '+' : ''}${data.weightChange30d} lbs over 30 days)`
        : ''
    row('Weight (latest)', `${data.weightLatest} lbs${change}`)
  } else {
    row('Weight', 'Not logged')
  }
  if (data.bpLatest) {
    row(
      'Blood pressure (latest)',
      `${data.bpLatest.systolic}/${data.bpLatest.diastolic} (${data.bpLatest.date})`,
    )
  }
  if (data.a1cLatest) {
    row('A1C (latest)', `${data.a1cLatest.value}% (${data.a1cLatest.date})`)
  }

  if (data.recentLabs.length > 0) {
    y += 2
    subheading('Recent lab results')
    for (const lab of data.recentLabs) {
      row(
        lab.testName,
        `${lab.value}${lab.unit ? ` ${lab.unit}` : ''} (${lab.date})`,
      )
    }
  }

  y += 2
  heading('Daily averages (30 days)')
  row('Sleep', data.avgSleep30d != null ? `${data.avgSleep30d} hours` : '—')
  row('Energy (1–10)', data.avgEnergy30d != null ? String(data.avgEnergy30d) : '—')
  row('Mood (1–10)', data.avgMood30d != null ? String(data.avgMood30d) : '—')
  row('Stress (1–10)', data.avgStress30d != null ? String(data.avgStress30d) : '—')
  if (data.medAdherencePct != null) {
    row('Med & supplement adherence', `${data.medAdherencePct}% (30 days)`)
  }

  if (data.activeMeds.length > 0) {
    y += 2
    heading('Current medications & supplements')
    for (const med of data.activeMeds) {
      body(`• ${med.name}${med.dosage ? ` — ${med.dosage}` : ''} (${med.type})`, 2)
    }
  }

  const weekLabel = formatWeekRange(getWeekStartISO())
  y += 2
  heading(`This week (${weekLabel})`)
  row('Days logged', String(data.weekStats.daysLogged))
  if (data.weekStats.avgSleepHours != null) {
    row('Avg sleep', `${data.weekStats.avgSleepHours} hrs`)
  }
  if (data.weekStats.avgEnergy != null) row('Avg energy', String(data.weekStats.avgEnergy))
  if (data.weekStats.avgMood != null) row('Avg mood', String(data.weekStats.avgMood))
  if (data.weekStats.medAdherencePct != null) {
    row('Med adherence', `${data.weekStats.medAdherencePct}%`)
  }

  if (data.weeklyCheckin) {
    y += 2
    heading('Weekly honest check-in')
    if (data.weeklyCheckin.went_well?.trim()) {
      subheading('What went well')
      body(data.weeklyCheckin.went_well.trim())
    }
    if (data.weeklyCheckin.was_hard?.trim()) {
      subheading('What felt hard')
      body(data.weeklyCheckin.was_hard.trim())
    }
    if (data.weeklyCheckin.focus_next_week?.trim()) {
      subheading('Focus for next week')
      body(data.weeklyCheckin.focus_next_week.trim())
    }
    if (data.weeklyCheckin.provider_notes?.trim()) {
      subheading('Notes for provider')
      body(data.weeklyCheckin.provider_notes.trim())
    }
  }

  y += 4
  ensureSpace(20)
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  const disclaimer =
    'This summary is for personal tracking and to support conversations with your healthcare provider. It is not medical advice, diagnosis, or treatment.'
  const disclaimerLines = doc.splitTextToSize(disclaimer, maxWidth) as string[]
  for (const line of disclaimerLines) {
    doc.text(line, MARGIN, y)
    y += 4
  }

  doc.save(`honest-reset-visit-summary-${data.generatedDate.replace(/\//g, '-')}.pdf`)
}
