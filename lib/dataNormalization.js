/**
 * dataNormalization.js — Input Sanitization Helpers
 *
 * Provides two validators used throughout the system before writing to the DB:
 *   - toMoneyNumber: converts UI/API amount strings to clean positive numbers
 *   - toDateValue: converts multiple date formats to a UTC Date object
 *
 * Both functions return null on invalid input so callers can gate writes.
 */

/**
 * toMoneyNumber(value, options)
 * Converts a user-typed amount string to a safe number.
 *   - Strips comma thousand-separators (e.g. "1,500" → 1500)
 *   - Returns null for NaN, Infinity, or negative values
 *   - allowZero: set true for analytics use-cases that need 0 to be valid
 *
 * Examples:
 *   toMoneyNumber('1,500.00')  → 1500
 *   toMoneyNumber('0')         → null  (default: zero not allowed)
 *   toMoneyNumber('-5')        → null
 *   toMoneyNumber('abc')       → null
 */
export const toMoneyNumber = (value, { allowZero = false } = {}) => {
  // Normalize number-like text from UI/API by removing thousand separators and spaces.
  const normalized = String(value ?? '')
    .replace(/,/g, '')
    .trim();

  // Return null for NaN/Infinity so callers can treat it as invalid input.
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;

  // Some workflows (for example analytics) may allow 0, but never negative values.
  if (allowZero) return parsed >= 0 ? parsed : null;

  // Default business rule: amount must be strictly positive.
  return parsed > 0 ? parsed : null;
};

/**
 * toDateValue(value)
 * Converts various date input formats to a UTC Date object.
 * Supported formats (in priority order):
 *   1. Date object         → returned as-is if valid
 *   2. dd/mm/yyyy string  → Thai date picker format
 *   3. yyyy-mm-dd string  → HTML date input / ISO date
 *   4. Any other string   → delegated to JS Date constructor (ISO datetime etc.)
 *
 * Returns null for empty, invalid, or unparseable inputs.
 */
export const toDateValue = (value) => {
  // Fast-path for Date objects and reject invalid Date instances.
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value ?? '').trim();
  if (!raw) return null;

  // Support Thai-style dd/mm/yyyy input explicitly to avoid locale ambiguity.
  const ddmmyyyy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Support canonical yyyy-mm-dd from date pickers/forms.
  const yyyymmdd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) {
    const [, yyyy, mm, dd] = yyyymmdd;
    const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Final fallback lets JS parse ISO/date-time strings from external providers.
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};
