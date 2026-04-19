/**
 * utils.js — Tailwind CSS Class Merge Utility
 *
 * Exports `cn(...inputs)` which combines clsx (conditional class building)
 * with tailwind-merge (resolves conflicting Tailwind utility classes).
 *
 * Usage: cn('p-4', isActive && 'bg-amber-600', 'p-2')  → 'bg-amber-600 p-2'
 * The last p-2 wins because tailwind-merge deduplicates conflicting spacing classes.
 */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
