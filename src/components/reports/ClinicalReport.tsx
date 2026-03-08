import { useState } from 'react'
import jsPDF from 'jspdf'
import { FileText, Download, Loader } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { PHASE_LABELS } from '../../types'
import { formatDate } from '../../lib/utils'
import type { Patient } from '../../types'

interface Props {
  patient?: Patient
}

export function ClinicalReport({ patient: propPatient }: Props) {
  const { patients, selectedPatientId } = useStore()
  const patient = propPatient ?? patients.find(p => p.id === selectedPatientId) ?? patients[0]

  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  if (!patient) return null

  async function generatePDF() {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 600)) // simulate processing

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const PAGE_W = 210
    const MARGIN = 18
    const CONTENT_W = PAGE_W - MARGIN * 2
    let y = MARGIN

    // ── Helpers ───────────────────────────────────────────────────────────────
    function addLine(offsetY = 4) { y += offsetY }

    function header(text: string, fontSize = 12, color: [number, number, number] = [15, 130, 120]) {
      doc.setFontSize(fontSize)
      doc.setTextColor(...color)
      doc.setFont('helvetica', 'bold')
      doc.text(text, MARGIN, y)
      doc.setTextColor(0, 0, 0)
      addLine(5)
    }

    function body(text: string, fontSize = 9, indent = 0) {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      const lines = doc.splitTextToSize(text, CONTENT_W - indent) as string[]
      doc.text(lines, MARGIN + indent, y)
      y += lines.length * (fontSize * 0.4 + 1.5)
      doc.setTextColor(0, 0, 0)
    }

    function kv(key: string, value: string) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(80, 80, 80)
      doc.text(`${key}:`, MARGIN, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(40, 40, 40)
      doc.text(value, MARGIN + 45, y)
      addLine(5)
    }

    function separator() {
      doc.setDrawColor(220, 220, 220)
      doc.line(MARGIN, y, PAGE_W - MARGIN, y)
      addLine(5)
    }

    function checkPage() {
      if (y > 270) {
        doc.addPage()
        y = MARGIN
      }
    }

    // ── Cover header ──────────────────────────────────────────────────────────
    doc.setFillColor(15, 130, 120)
    doc.rect(0, 0, PAGE_W, 28, 'F')
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('ONCOWELLNESS · Informe de Valor Clínico', MARGIN, 12)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}   ·   Modelo MSK de Orquestación Clínica`, MARGIN, 21)
    doc.setTextColor(0, 0, 0)
    y = 36

    // ── Patient data ──────────────────────────────────────────────────────────
    header('1. IDENTIFICACIÓN DEL PACIENTE', 11)
    kv('Nombre', patient.name)
    kv('Edad / Sexo', `${patient.age} años / ${patient.gender === 'F' ? 'Mujer' : 'Hombre'}`)
    kv('Diagnóstico', `${patient.diagnosis} (${patient.cancerType}, Estadio ${patient.stage})`)
    kv('Oncólogo', patient.oncologist)
    kv('Fecha Dx', formatDate(patient.diagnosisDate))
    kv('Fase Actual', `${patient.currentPhase} – ${PHASE_LABELS[patient.currentPhase]}`)
    kv('Estado mental', patient.mindState)
    kv('Alerta', patient.alertStatus.toUpperCase())
    separator()

    // ── Functional metrics ────────────────────────────────────────────────────
    checkPage()
    header('2. MÉTRICAS FUNCIONALES', 11)

    const baselineHG = patient.handgrip.find(h => h.isBaseline)
    const latestHG = patient.handgrip[patient.handgrip.length - 1]
    if (baselineHG && latestHG) {
      kv('Handgrip Basal (dom.)', `${baselineHG.dominantHand} kg`)
      kv('Handgrip Actual (dom.)', `${latestHG.dominantHand} kg  (Δ ${(latestHG.dominantHand - baselineHG.dominantHand).toFixed(1)} kg)`)
    }
    const baselineSW = patient.sixMWT.find(s => s.isBaseline)
    const latestSW = patient.sixMWT[patient.sixMWT.length - 1]
    if (baselineSW && latestSW) {
      kv('6MWT Basal', `${baselineSW.distanceMeters} m`)
      kv('6MWT Actual', `${latestSW.distanceMeters} m  (Δ ${latestSW.distanceMeters - baselineSW.distanceMeters} m)`)
    }
    separator()

    // ── Psychological metrics ─────────────────────────────────────────────────
    checkPage()
    header('3. ESTADO PSICOLÓGICO', 11)
    const latestPHQ9 = patient.phq9[patient.phq9.length - 1]
    const latestGAD7 = patient.gad7[patient.gad7.length - 1]
    if (latestPHQ9) {
      kv('PHQ-9 (último)', `${latestPHQ9.totalScore}/27 – ${latestPHQ9.severity.replace('_', ' ')}`)
      if (latestPHQ9.totalScore >= 10) {
        body('⚠ Puntuación en umbral de riesgo. Protocolo PS-01 activado.', 9, 2)
      }
    }
    if (latestGAD7) {
      kv('GAD-7 (último)', `${latestGAD7.totalScore}/21 – ${latestGAD7.severity}`)
    }
    separator()

    // ── Quality of life ───────────────────────────────────────────────────────
    checkPage()
    header('4. CALIDAD DE VIDA (PROMs)', 11)
    const latestFACIT = patient.facitf[patient.facitf.length - 1]
    const latestEORTC = patient.eortc[patient.eortc.length - 1]
    if (latestFACIT) {
      kv('FACIT-F Fatiga', `${latestFACIT.totalScore}/52`)
    }
    if (latestEORTC) {
      kv('EORTC Salud Global', `${latestEORTC.globalHealth}/100`)
      kv('EORTC Func. Física', `${latestEORTC.physicalFunction}/100`)
      kv('EORTC Func. Emocional', `${latestEORTC.emotionalFunction}/100`)
      kv('EORTC Fatiga', `${latestEORTC.fatigue}/100`)
      kv('EORTC Dolor', `${latestEORTC.pain}/100`)
    }
    separator()

    // ── Programs & sessions ───────────────────────────────────────────────────
    checkPage()
    header('5. PROGRAMAS Y SESIONES', 11)
    kv('Bundles Activos', patient.assignedBundles.join(', ') || 'Ninguno')
    kv('Programas Activos', patient.assignedPrograms.join(', ') || 'Ninguno')
    addLine(2)
    const completedSessions = patient.sessions.filter(s => s.status === 'realizada').length
    const totalSessions = patient.sessions.length
    kv('Sesiones Realizadas', `${completedSessions} / ${totalSessions}`)
    separator()

    // ── Crisis orders ─────────────────────────────────────────────────────────
    if (patient.crisisOrders.length > 0) {
      checkPage()
      header('6. ÓRDENES DE CRISIS', 11)
      patient.crisisOrders.forEach(c => {
        body(`· [${c.status.toUpperCase()}] ${c.trigger} (${formatDate(c.date)}) → ${c.program}`, 9, 2)
        if (c.notes) body(`  ${c.notes}`, 8, 4)
      })
      separator()
    }

    // ── Clinical notes ────────────────────────────────────────────────────────
    if (patient.clinicalNotes.length > 0) {
      checkPage()
      header('7. NOTAS CLÍNICAS', 11)
      patient.clinicalNotes.forEach(n => {
        checkPage()
        body(`[${n.type.toUpperCase()}] ${formatDate(n.date)} – ${n.author}`, 9, 2)
        body(n.content, 8, 4)
        addLine(2)
      })
      separator()
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Oncowellness CRM · Informe confidencial · Página ${i} de ${totalPages}`,
        MARGIN,
        290
      )
    }

    doc.save(`Informe_Clinico_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
    setGenerating(false)
    setGenerated(true)
    setTimeout(() => setGenerated(false), 4000)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-100 rounded-lg flex items-center justify-center">
            <FileText size={18} className="text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Informe de Valor Clínico</h3>
            <p className="text-xs text-slate-500">PDF para el oncólogo tratante</p>
          </div>
        </div>
        <button
          onClick={generatePDF}
          disabled={generating}
          className="flex items-center gap-2 bg-rose-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-rose-700 disabled:opacity-60"
        >
          {generating ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
          {generating ? 'Generando...' : generated ? '✓ Descargado' : 'Generar PDF'}
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Incluye: datos del paciente, journey F1–F8, métricas Handgrip + 6MWT, PHQ-9, FACIT-F,
        EORTC QLQ-C30, programas activos, sesiones, órdenes de crisis y notas clínicas.
      </p>
    </div>
  )
}
