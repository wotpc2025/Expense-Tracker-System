export const DEFAULT_EXPENSE_CATEGORIES = [
    'Food',
    'Transport',
    'Shopping',
    'Entertainment',
    'Rental',
    'Utilities',
    'Health',
    'Education',
    'Salary',
    'Freelance',
    'Travel',
    'Bills',
    'Other',
];

export const EXPENSE_CATEGORY_COLORS = {
    rental: '#f97316',
    entertainment: '#a855f7',
    shopping: '#ec4899',
    salary: '#22c55e',
    freelance: '#06b6d4',
    travel: '#14b8a6',
    food: '#eab308',
    transport: '#3b82f6',
    health: '#10b981',
    utilities: '#6366f1',
    education: '#f59e0b',
    bills: '#ef4444',
    other: '#94a3b8',
};

const CATEGORY_FALLBACK_PALETTE = [
    '#0ea5e9',
    '#8b5cf6',
    '#ec4899',
    '#f97316',
    '#14b8a6',
    '#22c55e',
    '#ef4444',
    '#6366f1',
    '#06b6d4',
    '#84cc16',
    '#f59e0b',
    '#d946ef',
];

function getColorFromCategoryName(category) {
    const key = normalizeCategoryName(category).toLowerCase();
    if (!key) return '#94a3b8';

    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }

    return CATEGORY_FALLBACK_PALETTE[hash % CATEGORY_FALLBACK_PALETTE.length];
}

export function normalizeCategoryName(category) {
    return String(category || '').trim();
}

export function getCategoryColor(category) {
    const key = normalizeCategoryName(category).toLowerCase();
    return EXPENSE_CATEGORY_COLORS[key] || getColorFromCategoryName(key);
}
