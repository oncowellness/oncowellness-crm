import type { ContentItem } from '../types'

export const CONTENT_LIBRARY: ContentItem[] = [
  {
    code: 'LB-01',
    title: 'Manual de Ejercicio Oncológico',
    type: 'manual',
    phases: ['F1', 'F2'],
    description: 'Guía completa de ejercicio seguro durante el proceso oncológico. Incluye rutinas adaptadas, consejos de seguridad y registro de progreso.',
  },
  {
    code: 'LB-02',
    title: 'Cuaderno de Afrontamiento',
    type: 'cuaderno',
    phases: ['F1', 'F2'],
    description: 'Herramienta psicoeducativa para gestionar emociones, pensamientos y estrategias de afrontamiento ante el diagnóstico.',
  },
  {
    code: 'DC-01',
    title: 'Kit de Manejo de Toxicidades',
    type: 'kit',
    phases: ['F3'],
    description: 'Guía práctica para manejar los efectos secundarios del tratamiento: náuseas, fatiga, mucositis, neuropatía y más.',
  },
  {
    code: 'LB-03',
    title: 'Guía de Bienestar Estético',
    type: 'guia',
    phases: ['F3'],
    description: 'Consejos de estética oncológica: cuidado del cabello, piel, uñas y recursos para mantener la imagen personal durante el tratamiento.',
  },
  {
    code: 'LB-04',
    title: 'Guía del Superviviente',
    type: 'guia',
    phases: ['F6', 'F7'],
    description: 'Manual de vida saludable post-tratamiento: ejercicio, nutrición, seguimiento médico y gestión de efectos tardíos.',
  },
  {
    code: 'LB-05',
    title: 'Guía para Familias y Cuidadores',
    type: 'manual',
    phases: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'],
    description: 'Recursos para el entorno familiar: cómo apoyar al paciente, autocuidado del cuidador y comunicación asertiva.',
  },
  {
    code: 'DC-02',
    title: 'Kit de Cuidados Paliativos',
    type: 'kit',
    phases: ['F8'],
    description: 'Guía de confort, control de síntomas y soporte emocional para pacientes y familias en fase avanzada.',
  },
]

// Rules engine: which content to auto-assign by phase
export const PHASE_CONTENT_RULES: Record<string, string[]> = {
  F1: ['LB-01', 'LB-02', 'LB-05'],
  F2: ['LB-01', 'LB-02', 'LB-05'],
  F3: ['DC-01', 'LB-03', 'LB-05'],
  F4: ['DC-01', 'LB-05'],
  F5: ['LB-05'],
  F6: ['LB-04', 'LB-05'],
  F7: ['LB-04', 'LB-05'],
  F8: ['DC-02', 'LB-05'],
}

// Empathic reminder templates by Mind State
export const REMINDER_TEMPLATES: Record<string, string> = {
  Activo: 'Hola {nombre}, te recordamos tu cita del {fecha}. ¡Eres una inspiración con tu actitud positiva! Nos vemos pronto.',
  Ansioso: 'Hola {nombre}, te recordamos tu cita del {fecha}. Entendemos que este proceso puede generar inquietud — nuestro equipo estará encantado de acompañarte.',
  Depresivo: 'Hola {nombre}, te pensamos y te recordamos tu cita del {fecha}. Estamos aquí para ti, cada paso cuenta.',
  Resiliente: 'Hola {nombre}, te recordamos tu cita del {fecha}. Tu fortaleza es admirable. Seguimos contigo en este camino.',
  Vulnerable: 'Hola {nombre}, con todo el cariño te recordamos tu cita del {fecha}. Cuídate mucho, y recuerda que no estás solo/a.',
}
