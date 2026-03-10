// ─── PROMs Instrument Definitions ────────────────────────────────────────────
// Central scoring engine & questionnaire catalog for Oncowellness CRM

export type PromsCategory = 'psycho' | 'physio'
export type LikertOption = { value: number; label: string }

export interface SeverityBand {
  min: number
  max: number
  key: string
  label: string
  color: string       // tailwind-safe
  bgClass: string
  textClass: string
  isRedFlag?: boolean
}

export interface PromsInstrument {
  key: string           // matches test_type enum
  name: string
  shortName: string
  category: PromsCategory
  subcategory: string
  description: string
  timeframe: string     // e.g. "últimas 2 semanas"
  questions: string[]
  likert: LikertOption[]
  minScore: number
  maxScore: number
  unit: string
  /** true = higher score is worse; false = higher is better */
  higherIsWorse: boolean
  severity: SeverityBand[]
  redFlagThreshold?: number
  redFlagMessage?: string
  /** Optional: custom scoring formula. Default = sum of answers */
  scoreFn?: (answers: number[]) => number
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIKERT SCALES (reusable)
// ═══════════════════════════════════════════════════════════════════════════════

const LIKERT_0_3: LikertOption[] = [
  { value: 0, label: 'Nunca' },
  { value: 1, label: 'Varios días' },
  { value: 2, label: 'Más de la mitad' },
  { value: 3, label: 'Casi todos los días' },
]

const LIKERT_0_4: LikertOption[] = [
  { value: 0, label: 'Nada' },
  { value: 1, label: 'Un poco' },
  { value: 2, label: 'Algo' },
  { value: 3, label: 'Bastante' },
  { value: 4, label: 'Mucho' },
]

const LIKERT_0_4_REV: LikertOption[] = [
  { value: 4, label: 'Nada' },
  { value: 3, label: 'Un poco' },
  { value: 2, label: 'Algo' },
  { value: 1, label: 'Bastante' },
  { value: 0, label: 'Mucho' },
]

const LIKERT_0_10: LikertOption[] = Array.from({ length: 11 }, (_, i) => ({ value: i, label: String(i) }))

const LIKERT_1_5: LikertOption[] = [
  { value: 1, label: 'Muy en desacuerdo' },
  { value: 2, label: 'En desacuerdo' },
  { value: 3, label: 'Ni acuerdo ni desacuerdo' },
  { value: 4, label: 'De acuerdo' },
  { value: 5, label: 'Muy de acuerdo' },
]

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY A: PSYCHO-ONCOLOGY
// ═══════════════════════════════════════════════════════════════════════════════

const PHQ9: PromsInstrument = {
  key: 'PHQ-9',
  name: 'Patient Health Questionnaire-9',
  shortName: 'PHQ-9',
  category: 'psycho',
  subcategory: 'Depresión',
  description: 'Evaluación de síntomas depresivos',
  timeframe: 'últimas 2 semanas',
  questions: [
    'Poco interés o placer en hacer las cosas',
    'Sentirse decaído/a, deprimido/a o sin esperanzas',
    'Dificultad para quedarse o permanecer dormido/a, o dormir demasiado',
    'Sentirse cansado/a o tener poca energía',
    'Tener poco apetito o comer en exceso',
    'Sentirse mal consigo mismo/a o pensar que es un fracasado/a',
    'Dificultad para concentrarse en cosas',
    'Moverse o hablar tan lentamente que otras personas lo han notado',
    'Pensamientos de que estaría mejor muerto/a o de hacerse daño',
  ],
  likert: LIKERT_0_3,
  minScore: 0,
  maxScore: 27,
  unit: 'pts',
  higherIsWorse: true,
  redFlagThreshold: 10,
  redFlagMessage: 'Protocolo de Crisis PS-01 activado',
  severity: [
    { min: 0, max: 4, key: 'minimal', label: 'Mínimo', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
    { min: 5, max: 9, key: 'mild', label: 'Leve', color: '#84cc16', bgClass: 'bg-lime-50', textClass: 'text-lime-700' },
    { min: 10, max: 14, key: 'moderate', label: 'Moderado', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700', isRedFlag: true },
    { min: 15, max: 19, key: 'moderately_severe', label: 'Mod. Grave', color: '#f97316', bgClass: 'bg-orange-50', textClass: 'text-orange-700', isRedFlag: true },
    { min: 20, max: 27, key: 'severe', label: 'Grave', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
  ],
}

const GAD7: PromsInstrument = {
  key: 'GAD-7',
  name: 'Generalized Anxiety Disorder-7',
  shortName: 'GAD-7',
  category: 'psycho',
  subcategory: 'Ansiedad',
  description: 'Evaluación de síntomas de ansiedad generalizada',
  timeframe: 'últimas 2 semanas',
  questions: [
    'Sentirse nervioso/a, ansioso/a o con los nervios de punta',
    'No poder dejar de preocuparse o no poder controlar la preocupación',
    'Preocuparse demasiado por diferentes cosas',
    'Dificultad para relajarse',
    'Estar tan inquieto/a que es difícil quedarse quieto/a',
    'Molestarse o ponerse irritable fácilmente',
    'Sentir miedo, como si algo terrible fuera a pasar',
  ],
  likert: LIKERT_0_3,
  minScore: 0,
  maxScore: 21,
  unit: 'pts',
  higherIsWorse: true,
  redFlagThreshold: 10,
  redFlagMessage: 'Ansiedad moderada-grave detectada',
  severity: [
    { min: 0, max: 4, key: 'minimal', label: 'Mínima', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
    { min: 5, max: 9, key: 'mild', label: 'Leve', color: '#84cc16', bgClass: 'bg-lime-50', textClass: 'text-lime-700' },
    { min: 10, max: 14, key: 'moderate', label: 'Moderada', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700', isRedFlag: true },
    { min: 15, max: 21, key: 'severe', label: 'Grave', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
  ],
}

const DISTRESS: PromsInstrument = {
  key: 'Distress',
  name: 'Termómetro de Distrés',
  shortName: 'Distrés',
  category: 'psycho',
  subcategory: 'Distrés',
  description: 'Escala visual analógica de distrés emocional (NCCN)',
  timeframe: 'última semana',
  questions: [
    '¿Cuál es su nivel de malestar emocional en una escala del 0 al 10?',
  ],
  likert: LIKERT_0_10,
  minScore: 0,
  maxScore: 10,
  unit: 'pts',
  higherIsWorse: true,
  redFlagThreshold: 7,
  redFlagMessage: 'Distrés severo — Derivación psicooncológica',
  severity: [
    { min: 0, max: 3, key: 'low', label: 'Bajo', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
    { min: 4, max: 6, key: 'moderate', label: 'Moderado', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 7, max: 10, key: 'severe', label: 'Severo', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
  ],
}

const ISI: PromsInstrument = {
  key: 'ISI',
  name: 'Insomnia Severity Index',
  shortName: 'ISI',
  category: 'psycho',
  subcategory: 'Insomnio',
  description: 'Evaluación de severidad del insomnio',
  timeframe: 'últimas 2 semanas',
  questions: [
    'Dificultad para conciliar el sueño',
    'Dificultad para mantener el sueño',
    'Despertares demasiado tempranos',
    'Satisfacción con su patrón de sueño actual',
    'Interferencia con el funcionamiento diario',
    'Grado en que otros notan su problema de sueño',
    'Preocupación/malestar por su problema de sueño',
  ],
  likert: LIKERT_0_4,
  minScore: 0,
  maxScore: 28,
  unit: 'pts',
  higherIsWorse: true,
  severity: [
    { min: 0, max: 7, key: 'none', label: 'Sin insomnio', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
    { min: 8, max: 14, key: 'subthreshold', label: 'Subclínico', color: '#84cc16', bgClass: 'bg-lime-50', textClass: 'text-lime-700' },
    { min: 15, max: 21, key: 'moderate', label: 'Moderado', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 22, max: 28, key: 'severe', label: 'Grave', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
  ],
}

const MQOL: PromsInstrument = {
  key: 'MQOL',
  name: 'McGill Quality of Life Questionnaire',
  shortName: 'MQOL',
  category: 'psycho',
  subcategory: 'Calidad de Vida',
  description: 'Evaluación de calidad de vida en cuidados paliativos',
  timeframe: 'últimos 2 días',
  questions: [
    'Mi condición física ha sido...',
    'Me he sentido deprimido/a...',
    'Me he sentido ansioso/a...',
    'Me he sentido solo/a...',
    'Me he sentido triste...',
    'Mi vida ha sido... (sin sentido ↔ con mucho sentido)',
    'He podido alcanzar mis objetivos...',
    'Mi existencia personal ha sido... (sin valor ↔ muy valiosa)',
    'Cada día ha sido... (una carga ↔ un regalo)',
    'El mundo ha sido... (un lugar impersonal ↔ un lugar acogedor)',
    'Me he sentido apoyado/a...',
    'Mi vida hasta este punto ha sido...',
  ],
  likert: LIKERT_0_10,
  minScore: 0,
  maxScore: 120,
  unit: 'pts',
  higherIsWorse: false,
  severity: [
    { min: 0, max: 40, key: 'poor', label: 'Deficiente', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700' },
    { min: 41, max: 70, key: 'moderate', label: 'Moderada', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 71, max: 90, key: 'good', label: 'Buena', color: '#84cc16', bgClass: 'bg-lime-50', textClass: 'text-lime-700' },
    { min: 91, max: 120, key: 'excellent', label: 'Excelente', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
  ],
}

const BIS: PromsInstrument = {
  key: 'BIS',
  name: 'Body Image Scale',
  shortName: 'BIS',
  category: 'psycho',
  subcategory: 'Imagen Corporal',
  description: 'Evaluación del impacto del cáncer en la imagen corporal',
  timeframe: 'actualmente',
  questions: [
    '¿Se ha sentido avergonzado/a de su apariencia?',
    '¿Ha sentido que el tratamiento le ha dejado el cuerpo menos completo?',
    '¿Se ha sentido insatisfecho/a con su apariencia cuando está vestido/a?',
    '¿Se ha sentido menos atractivo/a físicamente como resultado de su enfermedad o tratamiento?',
    '¿Se ha sentido menos femenina/masculino como resultado de su enfermedad o tratamiento?',
    '¿Le ha resultado difícil mirarse desnudo/a?',
    '¿Se ha sentido menos atractivo/a sexualmente como resultado de su enfermedad o tratamiento?',
    '¿Ha evitado verse en espejos?',
    '¿Se ha sentido insatisfecho/a con su cuerpo?',
    '¿Se ha sentido insatisfecho/a con la apariencia de su cicatriz?',
  ],
  likert: LIKERT_0_3,
  minScore: 0,
  maxScore: 30,
  unit: 'pts',
  higherIsWorse: true,
  severity: [
    { min: 0, max: 9, key: 'low', label: 'Bajo impacto', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
    { min: 10, max: 19, key: 'moderate', label: 'Moderado', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 20, max: 30, key: 'severe', label: 'Alto impacto', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
  ],
}

const ROSENBERG: PromsInstrument = {
  key: 'Rosenberg',
  name: 'Escala de Autoestima de Rosenberg',
  shortName: 'Rosenberg',
  category: 'psycho',
  subcategory: 'Autoestima',
  description: 'Evaluación de la autoestima global',
  timeframe: 'actualmente',
  questions: [
    'Siento que soy una persona digna de aprecio, al menos tanto como los demás',
    'Siento que tengo cualidades positivas',
    'En general, me inclino a pensar que soy un/a fracasado/a', // reversed
    'Soy capaz de hacer las cosas tan bien como la mayoría',
    'Siento que no tengo mucho de lo que sentirme orgulloso/a', // reversed
    'Tengo una actitud positiva hacia mí mismo/a',
    'En general estoy satisfecho/a conmigo mismo/a',
    'Me gustaría poder tener más respeto por mí mismo/a', // reversed
    'En definitiva, tiendo a sentir que soy un/a fracasado/a', // reversed
    'A veces creo que no soy buena persona', // reversed
  ],
  likert: LIKERT_1_5,
  minScore: 10,
  maxScore: 50,
  unit: 'pts',
  higherIsWorse: false,
  // Items 3,5,8,9,10 are reverse-scored (indices 2,4,7,8,9)
  scoreFn: (answers: number[]) => {
    const reversed = [2, 4, 7, 8, 9]
    return answers.reduce((sum, a, i) => {
      return sum + (reversed.includes(i) ? (6 - a) : a)
    }, 0)
  },
  severity: [
    { min: 10, max: 25, key: 'low', label: 'Baja autoestima', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
    { min: 26, max: 35, key: 'normal', label: 'Normal', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 36, max: 50, key: 'high', label: 'Alta autoestima', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY B: PHYSIOTHERAPY
// ═══════════════════════════════════════════════════════════════════════════════

const FACIT_F: PromsInstrument = {
  key: 'FACIT-F',
  name: 'FACIT-Fatigue Scale',
  shortName: 'FACIT-F',
  category: 'physio',
  subcategory: 'Fatiga',
  description: 'Evaluación funcional de fatiga relacionada con cáncer (13 ítems de fatiga)',
  timeframe: 'últimos 7 días',
  questions: [
    'Me siento fatigado/a',
    'Me siento débil en general',
    'Me siento apático/a (sin ganas de nada)',
    'Me siento cansado/a',
    'Tengo dificultad para empezar cosas porque estoy cansado/a',
    'Tengo dificultad para terminar cosas porque estoy cansado/a',
    'Tengo energía',
    'Soy capaz de hacer mis actividades habituales',
    'Necesito dormir durante el día',
    'Estoy demasiado cansado/a para comer',
    'Necesito ayuda para hacer mis actividades habituales',
    'Estoy frustrado/a por estar demasiado cansado/a',
    'Tengo que limitar mi actividad social porque estoy cansado/a',
  ],
  likert: LIKERT_0_4,
  minScore: 0,
  maxScore: 52,
  unit: 'pts',
  higherIsWorse: false,
  // Items 7,8 (indices 6,7) score normally; rest reverse: 4-answer
  scoreFn: (answers: number[]) => {
    const normalItems = [6, 7] // "Tengo energía", "Soy capaz..."
    return answers.reduce((sum, a, i) => {
      return sum + (normalItems.includes(i) ? a : (4 - a))
    }, 0)
  },
  severity: [
    { min: 0, max: 20, key: 'severe_fatigue', label: 'Fatiga Severa', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
    { min: 21, max: 35, key: 'moderate_fatigue', label: 'Fatiga Moderada', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 36, max: 45, key: 'mild_fatigue', label: 'Fatiga Leve', color: '#84cc16', bgClass: 'bg-lime-50', textClass: 'text-lime-700' },
    { min: 46, max: 52, key: 'no_fatigue', label: 'Sin Fatiga', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
  ],
}

const BFI: PromsInstrument = {
  key: 'BFI',
  name: 'Brief Fatigue Inventory',
  shortName: 'BFI',
  category: 'physio',
  subcategory: 'Fatiga',
  description: 'Inventario breve de fatiga (9 ítems)',
  timeframe: 'últimas 24 horas',
  questions: [
    'Nivel de fatiga ahora mismo',
    'Nivel habitual de fatiga en las últimas 24h',
    'Peor nivel de fatiga en las últimas 24h',
    'Interferencia de la fatiga con la actividad general',
    'Interferencia de la fatiga con el estado de ánimo',
    'Interferencia de la fatiga con la capacidad de caminar',
    'Interferencia de la fatiga con el trabajo habitual',
    'Interferencia de la fatiga con las relaciones sociales',
    'Interferencia de la fatiga con la capacidad de disfrutar',
  ],
  likert: LIKERT_0_10,
  minScore: 0,
  maxScore: 90,
  unit: 'pts',
  higherIsWorse: true,
  scoreFn: (answers) => {
    const avg = answers.reduce((s, a) => s + a, 0) / answers.length
    return Math.round(avg * 10) / 10
  },
  severity: [
    { min: 0, max: 3, key: 'mild', label: 'Leve', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
    { min: 3.01, max: 6, key: 'moderate', label: 'Moderada', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 6.01, max: 10, key: 'severe', label: 'Severa', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
  ],
}

const EVA: PromsInstrument = {
  key: 'EVA',
  name: 'Escala Visual Analógica de Dolor',
  shortName: 'EVA',
  category: 'physio',
  subcategory: 'Dolor',
  description: 'Escala visual analógica de dolor 0-10',
  timeframe: 'ahora mismo',
  questions: [
    '¿Cuál es su nivel de dolor en una escala del 0 al 10?',
  ],
  likert: LIKERT_0_10,
  minScore: 0,
  maxScore: 10,
  unit: 'pts',
  higherIsWorse: true,
  severity: [
    { min: 0, max: 0, key: 'none', label: 'Sin dolor', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
    { min: 1, max: 3, key: 'mild', label: 'Leve', color: '#84cc16', bgClass: 'bg-lime-50', textClass: 'text-lime-700' },
    { min: 4, max: 6, key: 'moderate', label: 'Moderado', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 7, max: 10, key: 'severe', label: 'Severo', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
  ],
}

const BPI: PromsInstrument = {
  key: 'BPI',
  name: 'Brief Pain Inventory',
  shortName: 'BPI',
  category: 'physio',
  subcategory: 'Dolor',
  description: 'Inventario breve de dolor',
  timeframe: 'última semana',
  questions: [
    'Peor dolor en las últimas 24h',
    'Dolor más leve en las últimas 24h',
    'Dolor promedio',
    'Dolor ahora mismo',
    'Interferencia del dolor con la actividad general',
    'Interferencia del dolor con el estado de ánimo',
    'Interferencia del dolor con la capacidad de caminar',
    'Interferencia del dolor con el trabajo habitual',
    'Interferencia del dolor con las relaciones sociales',
    'Interferencia del dolor con el sueño',
    'Interferencia del dolor con el disfrute de la vida',
  ],
  likert: LIKERT_0_10,
  minScore: 0,
  maxScore: 110,
  unit: 'pts',
  higherIsWorse: true,
  scoreFn: (answers) => {
    // Severity: avg items 1-4; Interference: avg items 5-11
    const severityAvg = answers.slice(0, 4).reduce((s, a) => s + a, 0) / 4
    const interferenceAvg = answers.slice(4).reduce((s, a) => s + a, 0) / 7
    return Math.round(((severityAvg + interferenceAvg) / 2) * 10) / 10
  },
  severity: [
    { min: 0, max: 3, key: 'mild', label: 'Leve', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
    { min: 3.01, max: 6, key: 'moderate', label: 'Moderado', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 6.01, max: 10, key: 'severe', label: 'Severo', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
  ],
}

const DASH: PromsInstrument = {
  key: 'DASH',
  name: 'Disabilities of the Arm, Shoulder and Hand',
  shortName: 'DASH',
  category: 'physio',
  subcategory: 'Miembro Superior',
  description: 'Evaluación funcional de miembro superior (11 ítems abreviados)',
  timeframe: 'última semana',
  questions: [
    'Abrir un bote apretado o nuevo',
    'Escribir',
    'Girar una llave',
    'Preparar una comida',
    'Empujar una puerta pesada',
    'Colocar un objeto en una estantería alta',
    'Realizar tareas domésticas pesadas',
    'Cuidar el jardín o hacer tareas del hogar',
    'Hacer la cama',
    'Llevar una bolsa de la compra o maletín',
    'Llevar un objeto pesado (más de 5 kg)',
  ],
  likert: [
    { value: 1, label: 'Sin dificultad' },
    { value: 2, label: 'Algo de dificultad' },
    { value: 3, label: 'Dificultad moderada' },
    { value: 4, label: 'Mucha dificultad' },
    { value: 5, label: 'Imposible' },
  ],
  minScore: 0,
  maxScore: 100,
  unit: '%',
  higherIsWorse: true,
  scoreFn: (answers) => {
    const sum = answers.reduce((s, a) => s + a, 0)
    return Math.round(((sum / answers.length - 1) / 4) * 100)
  },
  severity: [
    { min: 0, max: 25, key: 'mild', label: 'Discapacidad leve', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
    { min: 26, max: 50, key: 'moderate', label: 'Moderada', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 51, max: 75, key: 'severe', label: 'Grave', color: '#f97316', bgClass: 'bg-orange-50', textClass: 'text-orange-700', isRedFlag: true },
    { min: 76, max: 100, key: 'extreme', label: 'Extrema', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
  ],
}

const LEFS: PromsInstrument = {
  key: 'LEFS',
  name: 'Lower Extremity Functional Scale',
  shortName: 'LEFS',
  category: 'physio',
  subcategory: 'Miembro Inferior',
  description: 'Evaluación funcional de miembro inferior',
  timeframe: 'hoy',
  questions: [
    'Cualquier actividad habitual en casa o el trabajo',
    'Pasatiempos, actividades recreativas o deportivas habituales',
    'Entrar o salir de la bañera',
    'Caminar entre habitaciones',
    'Ponerse los calcetines o las medias',
    'Ponerse en cuclillas',
    'Levantar un objeto del suelo',
    'Realizar actividades ligeras en casa',
    'Realizar actividades pesadas en casa',
    'Subir o bajar de un coche',
    'Caminar 2 manzanas',
    'Subir o bajar 10 escalones',
    'Estar de pie durante 1 hora',
    'Estar sentado/a durante 1 hora',
    'Correr sobre terreno llano',
    'Correr sobre terreno irregular',
    'Realizar giros bruscos mientras corre',
    'Saltar',
    'Rodar en la cama',
    'Caminar 1.5 km',
  ],
  likert: LIKERT_0_4,
  minScore: 0,
  maxScore: 80,
  unit: 'pts',
  higherIsWorse: false,
  severity: [
    { min: 0, max: 20, key: 'severe', label: 'Discapacidad severa', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
    { min: 21, max: 40, key: 'moderate', label: 'Moderada', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 41, max: 60, key: 'mild', label: 'Leve', color: '#84cc16', bgClass: 'bg-lime-50', textClass: 'text-lime-700' },
    { min: 61, max: 80, key: 'minimal', label: 'Mínima', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
  ],
}

const LYMQOL: PromsInstrument = {
  key: 'LYMQOL',
  name: 'Lymphoedema Quality of Life Questionnaire',
  shortName: 'LYMQOL',
  category: 'physio',
  subcategory: 'Linfedema',
  description: 'Evaluación de calidad de vida en linfedema',
  timeframe: 'última semana',
  questions: [
    'Dificultad para encontrar ropa que le quede bien',
    'Dificultad para encontrar calzado que le quede bien',
    'Dificultad para moverse',
    'Dificultad en las actividades de ocio',
    'Dificultad en las actividades cotidianas',
    'Dolor o malestar en el miembro afectado',
    'Sensación de pesadez',
    'Sensación de tensión/hinchazón',
    'Preocupación por su apariencia',
    'Dificultad para dormir',
  ],
  likert: LIKERT_0_3,
  minScore: 0,
  maxScore: 30,
  unit: 'pts',
  higherIsWorse: true,
  severity: [
    { min: 0, max: 9, key: 'mild', label: 'Leve', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
    { min: 10, max: 19, key: 'moderate', label: 'Moderado', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 20, max: 30, key: 'severe', label: 'Severo', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
  ],
}

const IPAQ: PromsInstrument = {
  key: 'IPAQ',
  name: 'International Physical Activity Questionnaire',
  shortName: 'IPAQ',
  category: 'physio',
  subcategory: 'Actividad Física',
  description: 'Evaluación del nivel de actividad física (forma corta)',
  timeframe: 'últimos 7 días',
  questions: [
    'Días de actividad física vigorosa (última semana)',
    'Minutos por día de actividad vigorosa',
    'Días de actividad física moderada (última semana)',
    'Minutos por día de actividad moderada',
    'Días que caminó al menos 10 min (última semana)',
    'Minutos por día de caminata',
    'Horas sentado/a en un día laborable',
  ],
  likert: LIKERT_0_10,
  minScore: 0,
  maxScore: 70,
  unit: 'pts',
  higherIsWorse: false,
  scoreFn: (answers) => {
    // MET-minutes: Vigorous 8.0 * min * days + Moderate 4.0 * min * days + Walking 3.3 * min * days
    const vigMET = 8.0 * (answers[1] || 0) * (answers[0] || 0)
    const modMET = 4.0 * (answers[3] || 0) * (answers[2] || 0)
    const walkMET = 3.3 * (answers[5] || 0) * (answers[4] || 0)
    return Math.round(vigMET + modMET + walkMET)
  },
  severity: [
    { min: 0, max: 599, key: 'low', label: 'Bajo', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700' },
    { min: 600, max: 2999, key: 'moderate', label: 'Moderado', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 3000, max: 99999, key: 'high', label: 'Alto', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
  ],
}

const MFI: PromsInstrument = {
  key: 'MFI',
  name: 'Multidimensional Fatigue Inventory',
  shortName: 'MFI',
  category: 'physio',
  subcategory: 'Fatiga',
  description: 'Evaluación multidimensional de fatiga (20 ítems)',
  timeframe: 'últimos días',
  questions: [
    'Me siento en forma',
    'Físicamente me siento capaz de poco',
    'Me siento muy activo/a',
    'Tengo ganas de hacer todo tipo de cosas agradables',
    'Me siento cansado/a',
    'Creo que hago mucho en un día',
    'Cuando estoy haciendo algo puedo concentrarme',
    'Estoy en buena forma física',
    'Temo tener que hacer cosas',
    'Creo que hago muy poco en un día',
    'Me puedo concentrar bien',
    'Estoy descansado/a',
    'Me cuesta un gran esfuerzo concentrarme',
    'Mis condiciones físicas son deficientes',
    'Tengo muchos planes',
    'Me canso fácilmente',
    'Consigo hacer pocas cosas',
    'No tengo ganas de hacer nada',
    'Mis pensamientos se distraen fácilmente',
    'Físicamente me siento en mala condición',
  ],
  likert: LIKERT_1_5,
  minScore: 20,
  maxScore: 100,
  unit: 'pts',
  higherIsWorse: true,
  severity: [
    { min: 20, max: 40, key: 'low', label: 'Baja fatiga', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
    { min: 41, max: 60, key: 'moderate', label: 'Moderada', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 61, max: 80, key: 'high', label: 'Alta', color: '#f97316', bgClass: 'bg-orange-50', textClass: 'text-orange-700', isRedFlag: true },
    { min: 81, max: 100, key: 'severe', label: 'Severa', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
  ],
}

// Pelvic Health
const FSFI: PromsInstrument = {
  key: 'FSFI',
  name: 'Female Sexual Function Index',
  shortName: 'FSFI',
  category: 'physio',
  subcategory: 'Suelo Pélvico',
  description: 'Evaluación de función sexual femenina (6 dominios)',
  timeframe: 'últimas 4 semanas',
  questions: [
    'Frecuencia de deseo sexual',
    'Nivel de deseo sexual',
    'Frecuencia de excitación durante actividad sexual',
    'Nivel de excitación durante actividad sexual',
    'Confianza en lograr excitación',
    'Frecuencia de satisfacción con excitación',
    'Frecuencia de lubricación',
    'Dificultad para mantener lubricación',
    'Frecuencia de mantenimiento de lubricación hasta completar actividad',
    'Dificultad para mantener lubricación hasta completar',
    'Frecuencia de alcanzar orgasmo',
    'Dificultad para alcanzar orgasmo',
    'Satisfacción con la capacidad orgásmica',
    'Satisfacción con la cercanía emocional',
    'Satisfacción con la relación sexual',
    'Satisfacción con la vida sexual en general',
    'Frecuencia de dolor durante penetración',
    'Frecuencia de dolor después de penetración',
    'Nivel de dolor durante o después de penetración',
  ],
  likert: [
    { value: 0, label: 'Sin actividad / Nunca' },
    { value: 1, label: 'Casi nunca o nunca' },
    { value: 2, label: 'Pocas veces' },
    { value: 3, label: 'A veces' },
    { value: 4, label: 'La mayoría de las veces' },
    { value: 5, label: 'Casi siempre o siempre' },
  ],
  minScore: 2,
  maxScore: 36,
  unit: 'pts',
  higherIsWorse: false,
  scoreFn: (answers) => {
    // Simplified: sum / questions * 6 domains normalized
    const sum = answers.reduce((s, a) => s + a, 0)
    return Math.round((sum / answers.length) * 6 * 10) / 10
  },
  severity: [
    { min: 2, max: 19, key: 'dysfunction', label: 'Disfunción', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700' },
    { min: 19.01, max: 26.5, key: 'risk', label: 'Riesgo', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 26.51, max: 36, key: 'normal', label: 'Normal', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
  ],
}

const IIEF: PromsInstrument = {
  key: 'IIEF',
  name: 'International Index of Erectile Function',
  shortName: 'IIEF-5',
  category: 'physio',
  subcategory: 'Suelo Pélvico',
  description: 'Evaluación de función eréctil (IIEF-5 abreviado)',
  timeframe: 'últimas 4 semanas',
  questions: [
    'Confianza en conseguir y mantener una erección',
    'Cuando tuvo erecciones con estimulación sexual, ¿con qué frecuencia fueron suficientemente firmes para la penetración?',
    'Durante el coito, ¿con qué frecuencia pudo mantener la erección después de la penetración?',
    'Durante el coito, ¿cuán difícil fue mantener la erección hasta el final?',
    'Cuando intentó el coito, ¿con qué frecuencia fue satisfactorio?',
  ],
  likert: [
    { value: 1, label: 'Muy bajo/Casi nunca' },
    { value: 2, label: 'Bajo/Pocas veces' },
    { value: 3, label: 'Moderado/A veces' },
    { value: 4, label: 'Alto/La mayoría' },
    { value: 5, label: 'Muy alto/Casi siempre' },
  ],
  minScore: 5,
  maxScore: 25,
  unit: 'pts',
  higherIsWorse: false,
  severity: [
    { min: 5, max: 7, key: 'severe', label: 'DE Grave', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700' },
    { min: 8, max: 11, key: 'moderate', label: 'DE Moderada', color: '#f97316', bgClass: 'bg-orange-50', textClass: 'text-orange-700' },
    { min: 12, max: 16, key: 'mild_moderate', label: 'DE Leve-Mod', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 17, max: 21, key: 'mild', label: 'DE Leve', color: '#84cc16', bgClass: 'bg-lime-50', textClass: 'text-lime-700' },
    { min: 22, max: 25, key: 'normal', label: 'Normal', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
  ],
}

const ICIQ_SF: PromsInstrument = {
  key: 'ICIQ-SF',
  name: 'ICIQ Short Form (Incontinencia Urinaria)',
  shortName: 'ICIQ-SF',
  category: 'physio',
  subcategory: 'Suelo Pélvico',
  description: 'Evaluación de incontinencia urinaria',
  timeframe: 'últimas 4 semanas',
  questions: [
    '¿Con qué frecuencia pierde orina? (0=Nunca, 5=Continuamente)',
    '¿Cuánta orina pierde habitualmente? (0=Nada, 6=Mucha cantidad)',
    '¿En qué medida estas pérdidas afectan a su vida diaria? (0-10)',
  ],
  likert: LIKERT_0_10,
  minScore: 0,
  maxScore: 21,
  unit: 'pts',
  higherIsWorse: true,
  severity: [
    { min: 0, max: 0, key: 'none', label: 'Sin incontinencia', color: '#22c55e', bgClass: 'bg-green-50', textClass: 'text-green-700' },
    { min: 1, max: 7, key: 'mild', label: 'Leve', color: '#84cc16', bgClass: 'bg-lime-50', textClass: 'text-lime-700' },
    { min: 8, max: 14, key: 'moderate', label: 'Moderada', color: '#f59e0b', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
    { min: 15, max: 21, key: 'severe', label: 'Grave', color: '#ef4444', bgClass: 'bg-red-50', textClass: 'text-red-700', isRedFlag: true },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export function computeScore(instrument: PromsInstrument, answers: number[]): number {
  if (instrument.scoreFn) return instrument.scoreFn(answers)
  return answers.reduce((sum, a) => sum + a, 0)
}

export function getSeverityBand(instrument: PromsInstrument, score: number): SeverityBand | undefined {
  return instrument.severity.find(s => score >= s.min && score <= s.max)
}

export function isRedFlag(instrument: PromsInstrument, score: number): boolean {
  if (instrument.redFlagThreshold != null) {
    return instrument.higherIsWorse
      ? score >= instrument.redFlagThreshold
      : score <= instrument.redFlagThreshold
  }
  const band = getSeverityBand(instrument, score)
  return band?.isRedFlag ?? false
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

export const PROMS_INSTRUMENTS: PromsInstrument[] = [
  // Psycho-oncology
  PHQ9, GAD7, DISTRESS, ISI, MQOL, BIS, ROSENBERG,
  // Physiotherapy
  FACIT_F, BFI, MFI, EVA, BPI, DASH, LEFS, LYMQOL, IPAQ, FSFI, IIEF, ICIQ_SF,
]

export const PSYCHO_INSTRUMENTS = PROMS_INSTRUMENTS.filter(i => i.category === 'psycho')
export const PHYSIO_INSTRUMENTS = PROMS_INSTRUMENTS.filter(i => i.category === 'physio')

export function getInstrument(key: string): PromsInstrument | undefined {
  return PROMS_INSTRUMENTS.find(i => i.key === key)
}
