export const parseAdminEmails = (rawValue) => {
  return String(rawValue || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

export const getUserRoleValue = (user) => {
  const fromPublic = String(user?.publicMetadata?.role || '').toLowerCase()
  if (fromPublic) return fromPublic

  const fromUnsafe = String(user?.unsafeMetadata?.role || '').toLowerCase()
  if (fromUnsafe) return fromUnsafe

  return ''
}

export const isAdminByRole = (user) => {
  const role = getUserRoleValue(user)
  if (role === 'admin') return true

  const publicRoles = Array.isArray(user?.publicMetadata?.roles) ? user.publicMetadata.roles : []
  const unsafeRoles = Array.isArray(user?.unsafeMetadata?.roles) ? user.unsafeMetadata.roles : []

  const allRoles = [...publicRoles, ...unsafeRoles]
    .map((item) => String(item || '').toLowerCase())
    .filter(Boolean)

  return allRoles.includes('admin')
}

export const isAdminByEmailAllowlist = (user, rawAllowlist) => {
  const allowlist = parseAdminEmails(rawAllowlist)
  const userEmail = String(user?.primaryEmailAddress?.emailAddress || '').toLowerCase()
  return Boolean(userEmail) && allowlist.includes(userEmail)
}

export const isAdminUser = (user, rawAllowlist) => {
  return isAdminByRole(user) || isAdminByEmailAllowlist(user, rawAllowlist)
}
