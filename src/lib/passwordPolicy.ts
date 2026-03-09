interface PasswordCheck {
  label: string
  passed: boolean
}

interface PasswordValidation {
  isValid: boolean
  errors: string[]
  checks: PasswordCheck[]
}

export function validatePassword(password: string): PasswordValidation {
  const checks: PasswordCheck[] = [
    { label: 'Mínimo 14 caracteres', passed: password.length >= 14 },
    { label: 'Al menos una letra mayúscula', passed: /[A-Z]/.test(password) },
    { label: 'Al menos una letra minúscula', passed: /[a-z]/.test(password) },
    { label: 'Al menos un número', passed: /\d/.test(password) },
    { label: 'Al menos un símbolo (!@#$%...)', passed: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    { label: 'Sin 3+ caracteres repetidos seguidos', passed: !/(.)\1{2,}/.test(password) },
  ]

  const errors = checks.filter(c => !c.passed).map(c => c.label)

  return {
    isValid: errors.length === 0,
    errors,
    checks,
  }
}
