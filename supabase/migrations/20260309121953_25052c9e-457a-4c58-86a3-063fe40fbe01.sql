
-- Seed Programs
INSERT INTO public.programs (code, tipo, nombre, descripcion, sesiones, duracion) VALUES
('FX-01', 'FX', 'Evaluación Funcional Basal', 'Evaluación inicial: Handgrip, 6MWT, composición corporal', 1, NULL),
('FX-02', 'FX', 'Prehab Quirúrgico', 'Ejercicio preoperatorio para mejorar capacidad funcional', 8, '4 semanas'),
('FX-03', 'FX', 'Fisioterapia Oncológica Activa', 'Ejercicio terapéutico durante tratamiento activo', 16, '8 semanas'),
('FX-04', 'FX', 'Rehabilitación Post-tratamiento', 'Recuperación funcional tras finalizar tratamiento', 12, '6 semanas'),
('FX-05', 'FX', 'Manejo del Linfedema', 'Drenaje linfático manual y vendaje compresivo', 10, '5 semanas'),
('FX-06', 'FX', 'Rehabilitación Respiratoria', 'Fisioterapia respiratoria y entrenamiento muscular', 8, '4 semanas'),
('FX-07', 'FX', 'Suelo Pélvico Oncológico', 'Rehabilitación de disfunción pélvica post-tratamiento', 8, '4 semanas'),
('FX-08', 'FX', 'Ejercicio en Cuidados Paliativos', 'Programa adaptado para pacientes en fase avanzada', 8, 'Continuo'),
('FX-09', 'FX', 'Mantenimiento Superviviente', 'Programa de ejercicio a largo plazo para supervivientes', 4, 'Mensual'),
('PS-01', 'PS', 'Intervención en Crisis', 'Atención psicológica urgente ante desbordamiento emocional', 3, NULL),
('PS-02', 'PS', 'Evaluación Psicológica Basal', 'PHQ-9, GAD-7 y evaluación del estado emocional', 1, NULL),
('PS-03', 'PS', 'Terapia Cognitivo-Conductual', 'TCC adaptada a psico-oncología', 12, '12 semanas'),
('PS-04', 'PS', 'Mindfulness Oncológico', 'MBSR adaptado para pacientes oncológicos', 8, '8 semanas'),
('PS-05', 'PS', 'Soporte Familiar', 'Intervención familiar y de cuidadores', 6, '6 semanas'),
('PS-06', 'PS', 'Terapia de Duelo y Existencial', 'Acompañamiento en fase avanzada y proceso de duelo', 8, 'Continuo'),
('NU-01', 'NU', 'Valoración Nutricional', 'Cribado nutricional, antropometría y plan alimentario', 1, NULL),
('NU-02', 'NU', 'Intervención Nutricional Activa', 'Seguimiento nutricional durante tratamiento', 4, 'Mensual'),
('NU-03', 'NU', 'Manejo de Toxicidad Alimentaria', 'Adaptación dietética ante náuseas, mucositis, disfagia', 2, NULL),
('NU-04', 'NU', 'Plan Nutricional Superviviente', 'Alimentación anticáncer y prevención de recidivas', 3, 'Trimestral'),
('EO-01', 'EO', 'Asesoramiento Estético Oncológico', 'Cuidados del cabello, piel y bienestar estético', 2, NULL),
('EO-02', 'EO', 'Taller de Imagen Personal', 'Maquillaje, cuidado de la imagen durante tratamiento', 1, NULL),
('TS-01', 'TS', 'Valoración Social', 'Evaluación de recursos, apoyo familiar y laboral', 1, NULL),
('TS-02', 'TS', 'Gestión de Prestaciones', 'Tramitación de bajas, discapacidad, ayudas económicas', 2, NULL),
('TS-03', 'TS', 'Acompañamiento Social Continuo', 'Soporte social a lo largo del proceso', 4, 'Mensual')
ON CONFLICT (code) DO NOTHING;

-- Seed Bundles
INSERT INTO public.bundles (code, nombre, phase, descripcion, program_codes) VALUES
('PC-01', 'Pack Diagnóstico', 'F1', 'Evaluación multidisciplinar completa en el momento del diagnóstico', ARRAY['FX-01', 'PS-02', 'NU-01', 'TS-01']),
('PC-02', 'Pack Prehab', 'F2', 'Preparación física y psicológica preoperatoria o pre-tratamiento', ARRAY['FX-02', 'PS-03', 'NU-01', 'NU-02']),
('PC-03', 'Pack Tratamiento', 'F3', 'Soporte integral durante tratamiento activo (QT/RT/Cx)', ARRAY['FX-03', 'PS-04', 'NU-02', 'NU-03', 'EO-01', 'TS-02']),
('PC-04', 'Pack Supervivencia', 'F6', 'Programa de mantenimiento y seguimiento para supervivientes', ARRAY['FX-09', 'PS-04', 'NU-04', 'TS-03']),
('PC-05', 'Pack Avanzado', 'F8', 'Cuidados paliativos y soporte en enfermedad avanzada', ARRAY['FX-08', 'PS-06', 'NU-02', 'TS-03'])
ON CONFLICT (code) DO NOTHING;

-- Seed Content Items
INSERT INTO public.content_items (code, title, tipo, phases, description) VALUES
('LB-01', 'Manual de Ejercicio Oncológico', 'manual', ARRAY['F1', 'F2']::phase_journey[], 'Guía completa de ejercicio seguro durante el proceso oncológico. Incluye rutinas adaptadas, consejos de seguridad y registro de progreso.'),
('LB-02', 'Cuaderno de Afrontamiento', 'cuaderno', ARRAY['F1', 'F2']::phase_journey[], 'Herramienta psicoeducativa para gestionar emociones, pensamientos y estrategias de afrontamiento ante el diagnóstico.'),
('DC-01', 'Kit de Manejo de Toxicidades', 'kit', ARRAY['F3']::phase_journey[], 'Guía práctica para manejar los efectos secundarios del tratamiento: náuseas, fatiga, mucositis, neuropatía y más.'),
('LB-03', 'Guía de Bienestar Estético', 'guia', ARRAY['F3']::phase_journey[], 'Consejos de estética oncológica: cuidado del cabello, piel, uñas y recursos para mantener la imagen personal durante el tratamiento.'),
('LB-04', 'Guía del Superviviente', 'guia', ARRAY['F6', 'F7']::phase_journey[], 'Manual de vida saludable post-tratamiento: ejercicio, nutrición, seguimiento médico y gestión de efectos tardíos.'),
('LB-05', 'Guía para Familias y Cuidadores', 'manual', ARRAY['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8']::phase_journey[], 'Recursos para el entorno familiar: cómo apoyar al paciente, autocuidado del cuidador y comunicación asertiva.'),
('DC-02', 'Kit de Cuidados Paliativos', 'kit', ARRAY['F8']::phase_journey[], 'Guía de confort, control de síntomas y soporte emocional para pacientes y familias en fase avanzada.')
ON CONFLICT (code) DO NOTHING;
