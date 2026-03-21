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

export function normalizeCategoryName(category) {
    return String(category || '').trim();
}

export function getCategoryColor(category) {
    const key = normalizeCategoryName(category).toLowerCase();
    return EXPENSE_CATEGORY_COLORS[key] || '#94a3b8';
}
