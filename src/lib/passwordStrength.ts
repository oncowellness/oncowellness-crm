/**
 * Calculate password entropy-based strength (0-100)
 */
export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  if (!password) return { score: 0, label: '', color: '' }

  let charset = 0
  if (/[a-z]/.test(password)) charset += 26
  if (/[A-Z]/.test(password)) charset += 26
  if (/\d/.test(password)) charset += 10
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) charset += 32

  const entropy = password.length * Math.log2(charset || 1)

  // Map entropy to 0-100 score
  // < 28 bits = very weak, 28-35 = weak, 36-59 = fair, 60-80 = strong, 80+ = very strong
  const score = Math.min(100, Math.round((entropy / 80) * 100))

  if (score < 25) return { score, label: 'Muy débil', color: 'hsl(0, 84%, 60%)' }
  if (score < 45) return { score, label: 'Débil', color: 'hsl(25, 95%, 53%)' }
  if (score < 65) return { score, label: 'Aceptable', color: 'hsl(45, 93%, 47%)' }
  if (score < 85) return { score, label: 'Fuerte', color: 'hsl(142, 71%, 45%)' }
  return { score, label: 'Muy fuerte', color: 'hsl(142, 76%, 36%)' }
}
