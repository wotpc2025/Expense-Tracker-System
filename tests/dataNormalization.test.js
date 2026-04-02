import { describe, expect, it } from 'vitest';
import { toDateValue, toMoneyNumber } from '../lib/dataNormalization';

describe('toMoneyNumber', () => {
  it('parses comma formatted numbers', () => {
    expect(toMoneyNumber('1,250.50')).toBe(1250.5);
  });

  it('returns null for invalid values', () => {
    expect(toMoneyNumber('abc')).toBeNull();
    expect(toMoneyNumber(-10)).toBeNull();
  });

  it('allows zero when explicitly enabled', () => {
    expect(toMoneyNumber('0', { allowZero: true })).toBe(0);
  });
});

describe('toDateValue', () => {
  it('parses DD/MM/YYYY format', () => {
    const date = toDateValue('02/04/2026');
    expect(date).toBeInstanceOf(Date);
    expect(date.toISOString().slice(0, 10)).toBe('2026-04-02');
  });

  it('parses YYYY-MM-DD format', () => {
    const date = toDateValue('2026-04-02');
    expect(date).toBeInstanceOf(Date);
    expect(date.toISOString().slice(0, 10)).toBe('2026-04-02');
  });

  it('returns null for invalid date input', () => {
    expect(toDateValue('not-a-date')).toBeNull();
  });
});
