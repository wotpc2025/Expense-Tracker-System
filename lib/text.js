import { getTranslation } from '@/lib/translations'

/**
 * Lightweight translation helper used across the app.
 * Supports both call signatures:
 * - t('dashboard.title')            -> defaults to English
 * - t('th', 'dashboard.title')      -> explicit locale
 */
export function t(arg1, arg2) {
  if (typeof arg2 === 'string') {
    return getTranslation(arg1 || 'en', arg2)
  }

  return getTranslation('en', arg1)
}

export default t
