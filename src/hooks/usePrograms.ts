import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface ProgramRow {
  id: string
  code: string
  tipo: string
  nombre: string
  descripcion: string | null
  sesiones: number | null
  duracion: string | null
  tipo_intervencion: string | null
  objetivos: string | null
  sintomas: string | null
  momento_journey: string | null
  mind_state_paciente: string | null
  contenidos: string | null
  frecuencia: string | null
  duracion_semanas: number | null
  perfil_paciente: string | null
  recursos: string | null
  modalidad: string | null
  precio_sesion: number | null
  coste_sesion: number | null
  canal_captacion: string | null
  indicadores_resultado: string | null
  productos_asociados: string | null
  paquetes_relacionados: string | null
}

export type ProgramInsert = Omit<ProgramRow, 'id'>

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('code', { ascending: true })
      if (error) throw error
      return data as unknown as ProgramRow[]
    },
  })
}

export function useCreateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (program: ProgramInsert) => {
      const { data, error } = await supabase.from('programs').insert(program as any).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  })
}

export function useUpdateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<ProgramRow> & { id: string }) => {
      const { data, error } = await supabase.from('programs').update(fields as any).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  })
}
