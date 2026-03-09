import { useState } from 'react'
import jsPDF from 'jspdf'
import { FileText, Download, Loader } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatient } from '@/hooks/usePatients'
import { useClinicalTests } from '@/hooks/useClinicalTests'
import { useSessions } from '@/hooks/useSessions'
import { useCrisisOrders } from '@/hooks/useCrisisOrders'
import { useClinicalNotes } from '@/hooks/useClinicalNotes'
import { PHASE_LABELS, type Phase } from '../../types'
import { formatDate } from '../../lib/utils'

export function ClinicalReport() {
  const { selectedPatientId } = useStore()
  const { data: patient } = usePatient(selectedPatientId)
  const { data: clinicalTests = [] } = useClinicalTests(selectedPatientId)
  const { data: sessions = [] } = useSessions(selectedPatientId)
  const { data: crisisOrders = [] } = useCrisisOrders(selectedPatientId)
  const { data: clinicalNotes = [] } = useClinicalNotes(selectedPatientId)

  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  if (!patient) return null

  const getVal = (t: any) => t?.valor_numerico ?? 0

  async function generatePDF() {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 600))

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const PAGE_W = 210
    const MARGIN = 18
    const CONTENT_W = PAGE_W - MARGIN * 2
    let y = MARGIN

    function addLine(offsetY = 4) { y += offsetY }
    function header(text: string, fontSize = 12, color: [number, number, number] = [15, 130, 120]) {
      doc.setFontSize(fontSize); doc.setTextColor(...color); doc.setFont('helvetica', 'bold')
      doc.text(text, MARGIN, y); doc.setTextColor(0, 0, 0); addLine(5)
    }
    function body(text: string, fontSize = 9, indent = 0) {
      doc.setFontSize(fontSize); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
      const lines = doc.splitTextToSize(text, CONTENT_W - indent) as string[]
      doc.text(lines, MARGIN + indent, y); y += lines.length * (fontSize * 0.4 + 1.5); doc.setTextColor(0, 0, 0)
    }
    function kv(key: string, value: string) {
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80)
      doc.text(`${key}:`, MARGIN, y); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40)
      doc.text(value, MARGIN + 45, y); addLine(5)
    }
    function separator() { doc.setDrawColor(220, 220, 220); doc.line(MARGIN, y, PAGE_W - MARGIN, y); addLine(5) }
    function checkPage() { if (y > 270) { doc.addPage(); y = MARGIN } }

    doc.setFillColor(15, 130, 120); doc.rect(0, 0, PAGE_W, 28, 'F')
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
    doc.text('ONCOWELLNESS · Informe de Valor Clínico', MARGIN, 12)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, MARGIN, 21)
    doc.setTextColor(0, 0, 0); y = 36

    header('1. IDENTIFICACIÓN DEL PACIENTE', 11)
    kv('Nombre', patient!.nombre)
    kv('Edad / Sexo', `${patient!.edad} años / ${patient!.genero === 'F' ? 'Mujer' : 'Hombre'}`)
    kv('Diagnóstico', `${patient!.diagnostico} (${patient!.tipo_cancer}, Estadio ${patient!.estadio})`)
    kv('Oncólogo', patient!.oncologo_referente ?? '—')
    kv('Fase Actual', `${patient!.fase_journey} – ${PHASE_LABELS[patient!.fase_journey as Phase]}`)
    kv('Alerta', (patient!.alert_status ?? 'verde').toUpperCase())
    separator()

    checkPage(); header('2. TESTS CLÍNICOS', 11)
    const handgrips = clinicalTests.filter(t => t.tipo === 'Handgrip')
    const sixMWTs = clinicalTests.filter(t => t.tipo === '6MWT')
    const phq9s = clinicalTests.filter(t => t.tipo === 'PHQ-9')
    if (handgrips.length > 0) kv('Handgrip Último', `${getVal(handgrips[handgrips.length - 1])} kg`)
    if (sixMWTs.length > 0) kv('6MWT Último', `${getVal(sixMWTs[sixMWTs.length - 1])} m`)
    if (phq9s.length > 0) kv('PHQ-9 Último', `${getVal(phq9s[phq9s.length - 1])}/27`)
    separator()

    checkPage(); header('3. SESIONES', 11)
    const completed = sessions.filter(s => s.status === 'realizada').length
    kv('Sesiones Realizadas', `${completed} / ${sessions.length}`)
    separator()

    if (crisisOrders.length > 0) {
      checkPage(); header('4. ÓRDENES DE CRISIS', 11)
      crisisOrders.forEach(c => body(`· [${(c.status ?? '').toUpperCase()}] ${c.trigger_reason} (${formatDate(c.created_at)})`, 9, 2))
      separator()
    }

    if (clinicalNotes.length > 0) {
      checkPage(); header('5. NOTAS CLÍNICAS', 11)
      clinicalNotes.forEach(n => { checkPage(); body(`[${(n.tipo ?? '').toUpperCase()}] ${formatDate(n.created_at)} – ${n.author_name ?? '—'}`, 9, 2); body(n.content, 8, 4); addLine(2) })
    }

    const totalPages = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150, 150, 150)
      doc.text(`Oncowellness CRM · Confidencial · Pág ${i}/${totalPages}`, MARGIN, 290)
    }

    doc.save(`Informe_${patient!.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
    setGenerating(false); setGenerated(true)
    setTimeout(() => setGenerated(false), 4000)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-100 rounded-lg flex items-center justify-center"><FileText size={18} className="text-rose-600" /></div>
          <div><h3 className="text-sm font-semibold text-slate-700">Informe de Valor Clínico</h3><p className="text-xs text-slate-500">PDF para el oncólogo tratante</p></div>
        </div>
        <button onClick={generatePDF} disabled={generating} className="flex items-center gap-2 bg-rose-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-rose-700 disabled:opacity-60">
          {generating ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
          {generating ? 'Generando...' : generated ? '✓ Descargado' : 'Generar PDF'}
        </button>
      </div>
    </div>
  )
}
