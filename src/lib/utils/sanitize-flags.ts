const SENSITIVE_FLAGS = ['userEmail', 'userPassword', 'directusToken']

export const sanitizeFlags = (flags: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(flags).filter(([key]) => !SENSITIVE_FLAGS.includes(key))
  )
}
