const SENSITIVE_FLAGS = new Set(['directusToken', 'licenseKey', 'userEmail', 'userPassword'])

export const sanitizeFlags = (flags: Record<string, unknown>) => Object.fromEntries(
    Object.entries(flags).filter(([key]) => !SENSITIVE_FLAGS.has(key))
  )
