import { z } from 'zod'

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

function validateDNI(value: string): boolean {
  const match = value.match(/^(\d{8})([A-Z])$/)
  if (!match) return false
  const num = parseInt(match[1], 10)
  return match[2] === DNI_LETTERS[num % 23]
}

function validateNIE(value: string): boolean {
  const match = value.match(/^([XYZ])(\d{7})([A-Z])$/)
  if (!match) return false
  const prefix = { X: '0', Y: '1', Z: '2' }[match[1]] ?? '0'
  const num = parseInt(prefix + match[2], 10)
  return match[3] === DNI_LETTERS[num % 23]
}

export const adminInfoSchema = z.object({
  identification_type: z.enum(['DNI', 'NIE', 'Pasaporte']).nullable().optional(),
  identification_number: z.string().max(20).nullable().optional(),
  address_street: z.string().max(200).nullable().optional(),
  address_extra: z.string().max(100).nullable().optional(),
  postal_code: z.string().max(10).regex(/^\d{5}$/, 'Código postal debe tener 5 dígitos').nullable().optional().or(z.literal('').transform(() => null)).or(z.null()),
  city_name: z.string().max(100).nullable().optional(),
  province_name: z.string().max(100).nullable().optional(),
  country_code: z.string().max(5).nullable().optional(),
}).refine(
  (data) => {
    if (!data.identification_number || !data.identification_type) return true
    const val = data.identification_number.toUpperCase().trim()
    if (data.identification_type === 'DNI') return validateDNI(val)
    if (data.identification_type === 'NIE') return validateNIE(val)
    return val.length >= 5
  },
  { message: 'Número de identificación no válido', path: ['identification_number'] }
)

export type AdminInfoData = z.infer<typeof adminInfoSchema>
