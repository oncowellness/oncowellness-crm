import type { Program, Bundle } from '../types'

export const PROGRAMS: Program[] = [
  // ── Fisioterapia (FX) ──────────────────────────────────────────────────────
  { code: 'FX-01', type: 'FX', name: 'Evaluación Funcional Basal', description: 'Evaluación inicial: Handgrip, 6MWT, composición corporal', sessions: 1 },
  { code: 'FX-02', type: 'FX', name: 'Prehab Quirúrgico', description: 'Ejercicio preoperatorio para mejorar capacidad funcional', sessions: 8, duration: '4 semanas' },
  { code: 'FX-03', type: 'FX', name: 'Fisioterapia Oncológica Activa', description: 'Ejercicio terapéutico durante tratamiento activo', sessions: 16, duration: '8 semanas' },
  { code: 'FX-04', type: 'FX', name: 'Rehabilitación Post-tratamiento', description: 'Recuperación funcional tras finalizar tratamiento', sessions: 12, duration: '6 semanas' },
  { code: 'FX-05', type: 'FX', name: 'Manejo del Linfedema', description: 'Drenaje linfático manual y vendaje compresivo', sessions: 10, duration: '5 semanas' },
  { code: 'FX-06', type: 'FX', name: 'Rehabilitación Respiratoria', description: 'Fisioterapia respiratoria y entrenamiento muscular', sessions: 8, duration: '4 semanas' },
  { code: 'FX-07', type: 'FX', name: 'Suelo Pélvico Oncológico', description: 'Rehabilitación de disfunción pélvica post-tratamiento', sessions: 8, duration: '4 semanas' },
  { code: 'FX-08', type: 'FX', name: 'Ejercicio en Cuidados Paliativos', description: 'Programa adaptado para pacientes en fase avanzada', sessions: 8, duration: 'Continuo' },
  { code: 'FX-09', type: 'FX', name: 'Mantenimiento Superviviente', description: 'Programa de ejercicio a largo plazo para supervivientes', sessions: 4, duration: 'Mensual' },
  // ── Psico-oncología (PS) ──────────────────────────────────────────────────
  { code: 'PS-01', type: 'PS', name: 'Intervención en Crisis', description: 'Atención psicológica urgente ante desbordamiento emocional', sessions: 3 },
  { code: 'PS-02', type: 'PS', name: 'Evaluación Psicológica Basal', description: 'PHQ-9, GAD-7 y evaluación del estado emocional', sessions: 1 },
  { code: 'PS-03', type: 'PS', name: 'Terapia Cognitivo-Conductual', description: 'TCC adaptada a psico-oncología', sessions: 12, duration: '12 semanas' },
  { code: 'PS-04', type: 'PS', name: 'Mindfulness Oncológico', description: 'MBSR adaptado para pacientes oncológicos', sessions: 8, duration: '8 semanas' },
  { code: 'PS-05', type: 'PS', name: 'Soporte Familiar', description: 'Intervención familiar y de cuidadores', sessions: 6, duration: '6 semanas' },
  { code: 'PS-06', type: 'PS', name: 'Terapia de Duelo y Existencial', description: 'Acompañamiento en fase avanzada y proceso de duelo', sessions: 8, duration: 'Continuo' },
  // ── Nutrición (NU) ────────────────────────────────────────────────────────
  { code: 'NU-01', type: 'NU', name: 'Valoración Nutricional', description: 'Cribado nutricional, antropometría y plan alimentario', sessions: 1 },
  { code: 'NU-02', type: 'NU', name: 'Intervención Nutricional Activa', description: 'Seguimiento nutricional durante tratamiento', sessions: 4, duration: 'Mensual' },
  { code: 'NU-03', type: 'NU', name: 'Manejo de Toxicidad Alimentaria', description: 'Adaptación dietética ante náuseas, mucositis, disfagia', sessions: 2 },
  { code: 'NU-04', type: 'NU', name: 'Plan Nutricional Superviviente', description: 'Alimentación anticáncer y prevención de recidivas', sessions: 3, duration: 'Trimestral' },
  // ── Estética Oncológica (EO) ──────────────────────────────────────────────
  { code: 'EO-01', type: 'EO', name: 'Asesoramiento Estético Oncológico', description: 'Cuidados del cabello, piel y bienestar estético', sessions: 2 },
  { code: 'EO-02', type: 'EO', name: 'Taller de Imagen Personal', description: 'Maquillaje, cuidado de la imagen durante tratamiento', sessions: 1 },
  // ── Trabajo Social (TS) ───────────────────────────────────────────────────
  { code: 'TS-01', type: 'TS', name: 'Valoración Social', description: 'Evaluación de recursos, apoyo familiar y laboral', sessions: 1 },
  { code: 'TS-02', type: 'TS', name: 'Gestión de Prestaciones', description: 'Tramitación de bajas, discapacidad, ayudas económicas', sessions: 2 },
  { code: 'TS-03', type: 'TS', name: 'Acompañamiento Social Continuo', description: 'Soporte social a lo largo del proceso', sessions: 4, duration: 'Mensual' },
]

export const BUNDLES: Bundle[] = [
  {
    code: 'PC-01',
    name: 'Pack Diagnóstico',
    phase: 'F1',
    description: 'Evaluación multidisciplinar completa en el momento del diagnóstico',
    programs: ['FX-01', 'PS-02', 'NU-01', 'TS-01'],
  },
  {
    code: 'PC-02',
    name: 'Pack Prehab',
    phase: 'F2',
    description: 'Preparación física y psicológica preoperatoria o pre-tratamiento',
    programs: ['FX-02', 'PS-03', 'NU-01', 'NU-02'],
  },
  {
    code: 'PC-03',
    name: 'Pack Tratamiento',
    phase: 'F3',
    description: 'Soporte integral durante tratamiento activo (QT/RT/Cx)',
    programs: ['FX-03', 'PS-04', 'NU-02', 'NU-03', 'EO-01', 'TS-02'],
  },
  {
    code: 'PC-04',
    name: 'Pack Supervivencia',
    phase: 'F6',
    description: 'Programa de mantenimiento y seguimiento para supervivientes',
    programs: ['FX-09', 'PS-04', 'NU-04', 'TS-03'],
  },
  {
    code: 'PC-05',
    name: 'Pack Avanzado',
    phase: 'F8',
    description: 'Cuidados paliativos y soporte en enfermedad avanzada',
    programs: ['FX-08', 'PS-06', 'NU-02', 'TS-03'],
  },
]
