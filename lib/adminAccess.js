/**
 * adminAccess.js — Admin Role & Allowlist Helpers
 *
 * Provides three independent checks for admin status:
 *   1. Role-based  — reads Clerk publicMetadata.role (or unsafeMetadata fallback)
 *   2. Email allowlist — compares user email against ADMIN_EMAILS env variable
 *   3. isAdminUser — combines both strategies with OR logic
 *
 * All checks are pure functions that receive data rather than fetching it,
 * keeping them usable in both server components and server actions.
 */

/**
 * parseAdminEmails(rawValue)
 * Splits a comma-separated env string into a lowercase email array.
 * Input:  "admin@example.com, dev@example.com"
 * Output: ["admin@example.com", "dev@example.com"]
 */
export const parseAdminEmails = (rawValue) => {
  // Admin allowlist is configured as comma-separated env value.
  return String(rawValue || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * getUserRoleValue(user)
 * Extracts a normalized (lowercase) role string from a Clerk user object.
 * Reads publicMetadata first (trusted server-set value), then falls back to
 * unsafeMetadata (set by client — less trusted but supports older profiles).
 */
export const getUserRoleValue = (user) => {
  // Prefer trusted public metadata, fallback to unsafe metadata if needed.
  const fromPublic = String(user?.publicMetadata?.role || '').toLowerCase()
  if (fromPublic) return fromPublic

  const fromUnsafe = String(user?.unsafeMetadata?.role || '').toLowerCase()
  if (fromUnsafe) return fromUnsafe

  return ''
}

/**
 * isAdminByRole(user)
 * Returns true if the Clerk user has the 'admin' role.
 * Supports both scalar (role: 'admin') and array (roles: ['admin']) shapes
 * to maintain backwards compatibility with older Clerk profile structures.
 */
export const isAdminByRole = (user) => {
  const role = getUserRoleValue(user)
  if (role === 'admin') return true

  // Support array-based roles to keep compatibility with older profile structures.
  const publicRoles = Array.isArray(user?.publicMetadata?.roles) ? user.publicMetadata.roles : []
  const unsafeRoles = Array.isArray(user?.unsafeMetadata?.roles) ? user.unsafeMetadata.roles : []

  const allRoles = [...publicRoles, ...unsafeRoles]
    .map((item) => String(item || '').toLowerCase())
    .filter(Boolean)

  return allRoles.includes('admin')
}

/**
 * isAdminByEmailAllowlist(user, rawAllowlist)
 * Returns true if the user's primary email is in the rawAllowlist string.
 * rawAllowlist is typically process.env.ADMIN_EMAILS.
 */
export const isAdminByEmailAllowlist = (user, rawAllowlist) => {
  const allowlist = parseAdminEmails(rawAllowlist)
  const userEmail = String(user?.primaryEmailAddress?.emailAddress || '').toLowerCase()
  return Boolean(userEmail) && allowlist.includes(userEmail)
}

/**
 * isAdminUser(user, rawAllowlist)
 * Master admin check: grants access if EITHER role OR email allowlist passes.
 * Used in server-side route guards (e.g., admin layout) and Server Actions.
 */
export const isAdminUser = (user, rawAllowlist) => {
  // Access is granted if either role-based or allowlist-based check passes.
  return isAdminByRole(user) || isAdminByEmailAllowlist(user, rawAllowlist)
}
