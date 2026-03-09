import { useState } from 'react'
import jsPDF from 'jspdf'
import { FileText, Download, Loader } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatient } from '@/hooks/usePatients'
import { useClinicalTests } from '@/hooks/useClinicalTests'
import { useSessions } from '@/hooks/useSessions'
import { useCrisisOrders } from '@/hooks/useCrisisOrders'
import { useClinicalNotes } from '@/hooks/useClinicalNotes'
import { usePatientAlerts } from '@/hooks/useAlerts'
import { PHASE_LABELS, type Phase } from '../../types'
import { formatDate } from '../../lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const TEST_UNITS: Record<string, string> = {
  'Handgrip': 'kg', '6MWT': 'm', '30STS': 'rep', 'TUG': 's',
  'PHQ-9': '/27', 'GAD-7': '/21', 'FACIT-F': '/52', 'EORTC': 'pts',
  'Transverso': 'mm', 'Balance': 's',
}
const TEST_ORDER = ['Handgrip', '6MWT', '30STS', 'TUG', 'PHQ-9', 'GAD-7', 'FACIT-F', 'EORTC', 'Transverso', 'Balance']

export function ClinicalReport() {
  const { selectedPatientId } = useStore()
  const { profile } = useAuth()
  const { data: patient } = usePatient(selectedPatientId)
  const { data: clinicalTests = [] } = useClinicalTests(selectedPatientId)
  const { data: sessions = [] } = useSessions(selectedPatientId)
  const { data: crisisOrders = [] } = useCrisisOrders(selectedPatientId)
  const { data: clinicalNotes = [] } = useClinicalNotes(selectedPatientId)
  const { data: alerts = [] } = usePatientAlerts(selectedPatientId)

  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  if (!patient) return null

  const getVal = (t: any) => t?.valor_numerico ?? 0

  function calcImprovement(baseline: number, latest: number, invertBetter = false): string | null {
    if (!baseline || baseline === 0) return null
    const pct = ((latest - baseline) / baseline) * 100
    const improved = invertBetter ? pct < 0 : pct > 0
    const absPct = Math.abs(pct).toFixed(1)
    return `${improved ? '↑' : '↓'} ${absPct}% vs basal`
  }

  async function generatePDF() {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 400))

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const PAGE_W = 210
    const MARGIN = 18
    const CONTENT_W = PAGE_W - MARGIN * 2
    let y = MARGIN
    let sectionNum = 0

    function addLine(offsetY = 4) { y += offsetY }
    function checkPage(needed = 20) { if (y > 297 - needed) { doc.addPage(); y = MARGIN } }

    function sectionHeader(text: string) {
      sectionNum++
      checkPage(25)
      doc.setFillColor(240, 248, 247)
      doc.roundedRect(MARGIN - 2, y - 4, CONTENT_W + 4, 8, 1, 1, 'F')
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 130, 120)
      doc.text(`${sectionNum}. ${text}`, MARGIN, y)
      doc.setTextColor(0, 0, 0); addLine(8)
    }

    function kv(key: string, value: string, keyW = 48) {
      checkPage(8)
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 100, 100)
      doc.text(`${key}:`, MARGIN, y)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40)
      doc.text(value || '—', MARGIN + keyW, y); addLine(5)
    }

    function body(text: string, fontSize = 9, indent = 0) {
      doc.setFontSize(fontSize); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
      const lines = doc.splitTextToSize(text, CONTENT_W - indent) as string[]
      checkPage(lines.length * 5)
      doc.text(lines, MARGIN + indent, y)
      y += lines.length * (fontSize * 0.4 + 1.5)
      doc.setTextColor(0, 0, 0)
    }

    function separator() {
      doc.setDrawColor(220, 220, 220)
      doc.line(MARGIN, y, PAGE_W - MARGIN, y)
      addLine(5)
    }

    function tableRow(cols: string[], widths: number[], bold = false) {
      checkPage(8)
      doc.setFontSize(8); doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setTextColor(bold ? 60 : 80, bold ? 60 : 80, bold ? 60 : 80)
      let x = MARGIN
      cols.forEach((col, i) => { doc.text(col, x, y); x += widths[i] })
      addLine(4.5)
    }

    // === HEADER BANNER ===
    doc.setFillColor(15, 130, 120); doc.rect(0, 0, PAGE_W, 30, 'F')
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
    doc.text('ONCOWELLNESS', MARGIN, 12)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('Informe de Valor Clínico', MARGIN, 19)
    doc.setFontSize(8)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`, MARGIN, 25)
    doc.text(`Emisor: ${profile?.nombre ?? '—'}`, PAGE_W - MARGIN - 50, 25)
    doc.setTextColor(0, 0, 0); y = 38

    // === 1. PATIENT ID ===
    sectionHeader('IDENTIFICACIÓN DEL PACIENTE')
    kv('Código', patient.codigo)
    kv('Nombre', patient.nombre)
    kv('Edad / Sexo', `${patient.edad ?? '—'} años / ${patient.genero === 'F' ? 'Mujer' : patient.genero === 'M' ? 'Hombre' : patient.genero ?? '—'}`)
    kv('Diagnóstico', `${patient.diagnostico ?? '—'} (${patient.tipo_cancer ?? '—'}, Estadio ${patient.estadio ?? '—'})`)
    kv('Oncólogo Referente', patient.oncologo_referente ?? '—')
    kv('Fecha Diagnóstico', patient.fecha_diagnostico ? formatDate(patient.fecha_diagnostico) : '—')
    kv('Fase Actual', `${patient.fase_journey} – ${PHASE_LABELS[patient.fase_journey as Phase] ?? patient.fase_journey}`)
    kv('Estado Alerta', (patient.alert_status ?? 'verde').toUpperCase())
    kv('Estado Mental', patient.mind_state ?? '—')
    kv('Riesgo de Caída', patient.high_fall_risk ? 'SÍ — ALTO RIESGO' : 'No')
    separator()

    // === 2. CLINICAL TESTS ===
    sectionHeader('TESTS CLÍNICOS')

    const testsByType = new Map<string, typeof clinicalTests>()
    clinicalTests.forEach(t => {
      const arr = testsByType.get(t.tipo) ?? []
      arr.push(t)
      testsByType.set(t.tipo, arr)
    })

    if (testsByType.size === 0) {
      body('No se han registrado tests clínicos para este paciente.', 9, 2)
    } else {
      // Table header
      tableRow(['Test', 'Basal', 'Último', 'Variación', 'Fecha Último', 'N° Tests'], [30, 22, 22, 30, 30, 20], true)
      doc.setDrawColor(200, 200, 200); doc.line(MARGIN, y - 2, PAGE_W - MARGIN, y - 2); addLine(2)

      TEST_ORDER.forEach(tipo => {
        const tests = testsByType.get(tipo)
        if (!tests || tests.length === 0) return

        const baseline = tests.find(t => t.is_baseline)
        const sorted = [...tests].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        const latest = sorted[sorted.length - 1]
        const unit = TEST_UNITS[tipo] ?? ''
        const invertBetter = tipo === 'TUG' || tipo === 'PHQ-9' || tipo === 'GAD-7'

        const baseVal = baseline ? `${getVal(baseline)} ${unit}` : '—'
        const latestVal = `${getVal(latest)} ${unit}`
        const variation = baseline && latest
          ? calcImprovement(getVal(baseline), getVal(latest), invertBetter) ?? '—'
          : '—'
        const dateStr = formatDate(latest.created_at)

        tableRow([tipo, baseVal, latestVal, variation, dateStr, `${tests.length}`], [30, 22, 22, 30, 30, 20])
      })
    }
    separator()

    // === 3. SESSIONS ===
    sectionHeader('SESIONES TERAPÉUTICAS')
    const completed = sessions.filter(s => s.status === 'realizada').length
    const confirmed = sessions.filter(s => s.status === 'confirmada').length
    const pending = sessions.filter(s => s.status === 'pendiente').length
    const cancelled = sessions.filter(s => s.status === 'cancelada').length

    kv('Total Sesiones', `${sessions.length}`)
    kv('Realizadas', `${completed}`)
    kv('Confirmadas', `${confirmed}`)
    kv('Pendientes', `${pending}`)
    kv('Canceladas', `${cancelled}`)
    if (sessions.length > 0) {
      kv('Tasa de Adherencia', `${sessions.length > 0 ? ((completed / sessions.length) * 100).toFixed(1) : 0}%`)
    }
    addLine(3)

    // Session breakdown by program
    const sessionsByProgram = new Map<string, number>()
    sessions.filter(s => s.status === 'realizada').forEach(s => {
      sessionsByProgram.set(s.programa_code, (sessionsByProgram.get(s.programa_code) ?? 0) + 1)
    })
    if (sessionsByProgram.size > 0) {
      body('Desglose por programa (realizadas):', 9, 0)
      addLine(2)
      sessionsByProgram.forEach((count, code) => {
        body(`  · ${code}: ${count} sesiones`, 8, 4)
      })
    }
    separator()

    // === 4. ALERTS ===
    if (alerts.length > 0) {
      sectionHeader('ALERTAS CLÍNICAS')
      const unresolved = alerts.filter(a => !a.resolved)
      const resolved = alerts.filter(a => a.resolved)
      kv('Activas', `${unresolved.length}`)
      kv('Resueltas', `${resolved.length}`)
      addLine(2)

      alerts.slice(0, 15).forEach(a => {
        checkPage(10)
        const status = a.resolved ? '[RESUELTA]' : '[ACTIVA]'
        const sev = (a.severity ?? 'medium').toUpperCase()
        body(`${status} [${sev}] ${a.message ?? a.alert_type} — ${formatDate(a.created_at)}`, 8, 2)
      })
      separator()
    }

    // === 5. CRISIS ORDERS ===
    if (crisisOrders.length > 0) {
      sectionHeader('ÓRDENES DE CRISIS')
      crisisOrders.forEach(c => {
        checkPage(10)
        body(`· [${(c.status ?? '').toUpperCase()}] ${c.trigger_reason} — ${formatDate(c.created_at)}${c.notas ? ' | Notas: ' + c.notas : ''}`, 8, 2)
      })
      separator()
    }

    // === 6. CLINICAL NOTES ===
    if (clinicalNotes.length > 0) {
      sectionHeader('NOTAS CLÍNICAS')
      clinicalNotes.forEach(n => {
        checkPage(15)
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 60, 60)
        doc.text(`[${(n.tipo ?? 'evolución').toUpperCase()}] ${formatDate(n.created_at)} — ${n.author_name ?? '—'}`, MARGIN + 2, y)
        addLine(4)
        body(n.content, 8, 4)
        addLine(2)
      })
    }

    // === FOOTER on all pages ===
    const totalPages = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(7); doc.setTextColor(170, 170, 170); doc.setFont('helvetica', 'normal')
      doc.text(`Oncowellness CRM · Informe Confidencial · GDPR/PHI · Pág ${i}/${totalPages}`, MARGIN, 290)
      doc.text(`Código paciente: ${patient.codigo}`, PAGE_W - MARGIN - 40, 290)
    }

    doc.save(`Informe_Clinico_${patient.codigo}_${new Date().toISOString().split('T')[0]}.pdf`)
    setGenerating(false); setGenerated(true)
    setTimeout(() => setGenerated(false), 4000)
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-100 rounded-lg flex items-center justify-center">
            <FileText size={18} className="text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Informe de Valor Clínico</h3>
            <p className="text-xs text-muted-foreground">
              PDF completo para el oncólogo tratante · {clinicalTests.length} tests · {sessions.length} sesiones
            </p>
          </div>
        </div>
        <button
          onClick={generatePDF}
          disabled={generating}
          className="flex items-center gap-2 bg-rose-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-rose-700 disabled:opacity-60 transition-colors"
        >
          {generating ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
          {generating ? 'Generando...' : generated ? '✓ Descargado' : 'Generar PDF'}
        </button>
      </div>
    </div>
  )
}
