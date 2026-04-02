"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Download, LayoutGrid, List, MonitorCog, Pencil, RotateCcw, Search, Trash } from 'lucide-react'
import moment from 'moment';
import { useUser } from '@clerk/nextjs';
import { deleteExpenseAction, updateExpenseAction } from '@/app/_actions/dbActions';
import { toast } from 'sonner';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DEFAULT_EXPENSE_CATEGORIES, getCategoryColor, normalizeCategoryName } from '@/lib/expenseCategories';
import { getTranslation } from '@/lib/translations';
import { useTheme } from 'next-themes';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const EXPORT_LANGUAGE_OPTIONS = {
    th: {
        label: 'TH',
        locale: 'th-TH',
        headers: { name: 'ชื่อรายการ', category: 'หมวดหมู่', amount: 'จำนวนเงิน', createdAt: 'วันที่' },
    },
    en: {
        label: 'English',
        locale: 'en-US',
        headers: { name: 'Name', category: 'Category', amount: 'Amount', createdAt: 'Date' },
    },
};
function ExpensesListTable({
    expensesList,
    refreshData,
    gridHeight = '420px',
    density = 'comfortable',
    densityMode,
    onDensityChange,
    showDensityToggle = false,
}) {

    const [searchInput, setSearchInput] = useState('');
    const language = 'en';
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [customCategories, setCustomCategories] = useState([]);
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [mounted, setMounted] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', amount: '', category: '', createdAt: '' });
    const [editSaving, setEditSaving] = useState(false);
    const gridRef = useRef(null);
    const exportMenuRef = useRef(null);
    const { user } = useUser();
    const { resolvedTheme } = useTheme();
    const agThemeClass = mounted && resolvedTheme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz';

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, []);

    // (Removed duplicate declaration at line 227)

    const deleteExpense = useCallback(async (expense) => {
        const result = await deleteExpenseAction(expense.id);
        if (result) {
            toast.success('Expense Deleted!');
            refreshData && refreshData();
        }
    }, [refreshData]);

    const openEdit = useCallback((expense) => {
        // Convert DD/MM/YYYY → YYYY-MM-DD for <input type="date">
        const raw = expense.createdAt || '';
        const m = moment(raw, ['DD/MM/YYYY', 'YYYY-MM-DD', moment.ISO_8601], true);
        setEditForm({
            name: expense.name || '',
            amount: String(expense.amount || ''),
            category: expense.category || '',
            createdAt: m.isValid() ? m.format('YYYY-MM-DD') : '',
        });
        setEditingExpense(expense);
    }, []);

    const saveEdit = async () => {
        if (!editingExpense) return;
        if (!editForm.name.trim() || !editForm.amount || Number(editForm.amount) <= 0) {
            toast.error('Please fill in a valid name and amount.');
            return;
        }
        // Convert YYYY-MM-DD → DD/MM/YYYY for storage
        const m = moment(editForm.createdAt, 'YYYY-MM-DD', true);
        const storedDate = m.isValid() ? m.format('DD/MM/YYYY') : editForm.createdAt;
        setEditSaving(true);
        const result = await updateExpenseAction(editingExpense.id, {
            name: editForm.name.trim(),
            amount: editForm.amount,
            category: editForm.category || null,
            createdAt: storedDate,
        });
        setEditSaving(false);
        if (result) {
            toast.success('Expense updated!');
            setEditingExpense(null);
            refreshData && refreshData();
        } else {
            toast.error('Failed to update expense.');
        }
    };

    const exportToCSV = useCallback((selectedLanguage) => {
        if (!gridRef.current?.api) return;

        const sanitizeFileNamePart = (value) => {
            return String(value || '').toLowerCase().trim()
                .replace(/[^a-z0-9@._-]+/g, '-')
                .replace(/-+/g, '-').replace(/^-|-$/g, '');
        };

        const userName = sanitizeFileNamePart(user?.fullName || 'user');
        const userEmail = sanitizeFileNamePart(user?.primaryEmailAddress?.emailAddress || 'no-email');
        const languageConfig = EXPORT_LANGUAGE_OPTIONS[selectedLanguage] || EXPORT_LANGUAGE_OPTIONS.th;

        const formatCurrencyForLanguage = (value, locale) => {
            const amount = Number(value || 0);
            return amount.toLocaleString(locale, { style: 'currency', currency: 'THB', minimumFractionDigits: 2 });
        };

        const formatDateForLanguage = (value, locale) => {
            if (!value) return '-';
            const parsedDate = moment(value, ['DD/MM/YYYY', 'YYYY-MM-DD', moment.ISO_8601], true);
            if (!parsedDate.isValid()) return value;
            return locale === 'th-TH' ? parsedDate.format('DD/MM/YYYY') : parsedDate.format('MM/DD/YYYY');
        };

        gridRef.current.api.exportDataAsCsv({
            fileName: `expenses-${userName}-${userEmail}-${selectedLanguage}-${moment().format('YYYY-MM-DD')}.csv`,
            columnKeys: ['name', 'category', 'amount', 'createdAt'],
            processHeaderCallback: (params) => {
                const colId = params.column.getColId();
                return languageConfig.headers[colId] || colId;
            },
            processCellCallback: (params) => {
                if (params.column.getColId() === 'amount')
                    return formatCurrencyForLanguage(params.value, languageConfig.locale);
                if (params.column.getColId() === 'createdAt')
                    return formatDateForLanguage(params.value, languageConfig.locale);
                return params.value ?? '';
            },
        });
    }, [user]);

    const handleExportLanguageSelect = useCallback((language) => {
        exportToCSV(language);
        setShowExportMenu(false);
    }, [exportToCSV]);

    const formatCurrencyTHB = useCallback((value) => {
        const amount = Number(value || 0);
        return amount.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 });
    }, []);

    const formatExpenseDate = useCallback((value) => {
        if (!value) return '-';
        const parsedDate = moment(value, [moment.ISO_8601, 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'], true);
        if (parsedDate.isValid()) return parsedDate.format('DD/MM/YYYY');
        return value;
    }, []);

    const uniqueCategories = useMemo(() => {
        const cats = new Set([
            ...DEFAULT_EXPENSE_CATEGORIES,
            ...customCategories,
            ...(expensesList || []).map((e) => e.category).filter(Boolean),
        ]);
        return Array.from(cats).sort();
    }, [customCategories, expensesList]);

    const addCategoryOption = () => {
        const nextCategory = normalizeCategoryName(newCategory);

        if (!nextCategory) {
            toast.error('Please enter a category name');
            return;
        }

        const exists = uniqueCategories.some((cat) => cat.toLowerCase() === nextCategory.toLowerCase());
        if (exists) {
            setCategoryFilter(nextCategory);
            setAddCategoryOpen(false);
            setNewCategory('');
            return;
        }

        setCustomCategories((prev) => [...prev, nextCategory].sort((a, b) => a.localeCompare(b)));
        setCategoryFilter(nextCategory);
        toast.success(`Added category: ${nextCategory}`);
        setAddCategoryOpen(false);
        setNewCategory('');
    };

    const rowData = useMemo(() => {
        return (expensesList || [])
            .filter(e => categoryFilter === 'all' || (e.category || '') === categoryFilter)
            .map((expense) => ({
                ...expense,
                amount: Number(expense.amount || 0),
            }));
    }, [expensesList, categoryFilter]);

        const columnDefs = useMemo(() => [
                { headerName: language === 'th' ? 'ชื่อรายการ' : 'Name', field: 'name', minWidth: 200, flex: 1, filter: true },
                {
                        headerName: language === 'th' ? 'หมวดหมู่' : 'Category', field: 'category', minWidth: 145,
                        cellRenderer: (params) => {
                                if (!params.value) return <span className='text-slate-400 text-xs'>—</span>;
                                const color = getCategoryColor(params.value);
                                let label = params.value;
                                if (language === 'th') {
                                    // Always show Thai for known and custom categories
                                    // Try translation first
                                    const thLabel = getTranslation('th', `categories.${params.value.toLowerCase()}`);
                                    if (thLabel !== `categories.${params.value.toLowerCase()}`) {
                                        label = thLabel;
                                    } else {
                                        // Fallback: map common English names to Thai manually
                                        const manualMap = {
                                            'books': 'หนังสือ',
                                            'travel': 'การเดินทาง',
                                            'pets': 'สัตว์เลี้ยง',
                                            'food': 'อาหาร',
                                            'shopping': 'ช้อปปิ้ง',
                                            'entertainment': 'บันเทิง',
                                            'health': 'สุขภาพ',
                                            'education': 'การศึกษา',
                                            'beauty': 'ความงาม',
                                            'technology': 'เทคโนโลยี',
                                            'finance': 'การเงิน',
                                            'baby': 'เด็ก',
                                            'gifts': 'ของขวัญ',
                                            'work': 'งาน',
                                            'uncategorized': 'ไม่ระบุหมวดหมู่',
                                        };
                                        const lower = params.value.toLowerCase();
                                        if (manualMap[lower]) label = manualMap[lower];
                                    }
                                } else {
                                    const enLabel = getTranslation('en', `categories.${params.value.toLowerCase()}`);
                                    if (enLabel !== `categories.${params.value.toLowerCase()}`) label = enLabel;
                                }
                                return (
                                    <span style={{ backgroundColor: color, color: '#fff' }}
                                        className='px-2 py-0.5 rounded-full text-xs font-semibold'>
                                        {label}
                                    </span>
                                );
                        },
                },
        {
            headerName: language === 'th' ? 'จำนวนเงิน' : 'Amount', field: 'amount', minWidth: 150, initialSort: 'desc',
            valueFormatter: (params) => formatCurrencyTHB(params.value),
        },
        {
            headerName: language === 'th' ? 'วันที่ (วัน/เดือน/ปี)' : 'Date (DD/MM/YYYY)', field: 'createdAt', minWidth: 140, filter: true,
            valueFormatter: (params) => formatExpenseDate(params.value),
        },
        {
            headerName: language === 'th' ? 'แก้ไข / ลบ' : 'Edit / Delete', field: 'action', minWidth: 110, sortable: false,
            filter: false, suppressCsvExport: true,
            cellRenderer: (params) => (
                <div className='flex items-center gap-2 h-full'>
                    <button type='button' onClick={() => openEdit(params.data)}
                        className='text-slate-500 hover:text-amber-600 transition-colors cursor-pointer'
                        aria-label={language === 'th' ? 'แก้ไขรายการ' : 'Edit expense'}>
                        <Pencil className='h-4 w-4' />
                    </button>
                    <button type='button' onClick={() => deleteExpense(params.data)}
                        className='text-slate-500 hover:text-red-600 transition-colors cursor-pointer'
                        aria-label={language === 'th' ? 'ลบรายการ' : 'Delete expense'}>
                        <Trash className='h-4 w-4' />
                    </button>
                </div>
            ),
        },
    ], [deleteExpense, openEdit, formatCurrencyTHB, formatExpenseDate]);

    const defaultColDef = useMemo(() => ({
        sortable: true, resizable: true, filter: true, suppressHeaderMenuButton: false,
    }), []);

    const selectedDensityMode = densityMode || density;
    const effectiveDensity = density === 'compact' ? 'compact' : 'comfortable';
    const pageSize = effectiveDensity === 'compact' ? 12 : 8;
    const pageSizeOptions = effectiveDensity === 'compact' ? [12, 20, 30] : [8, 12, 20];
    const rowHeight = effectiveDensity === 'compact' ? 40 : 44;

    return (
        <div className={`mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-6 dark:border-slate-700 dark:bg-slate-800 ${effectiveDensity === 'compact' ? 'p-3 sm:p-4' : 'p-4 sm:p-5'}`}>
            <div className='flex items-center justify-between gap-3 flex-wrap'>
                <h2 className='text-lg font-bold sm:text-xl'>{language === 'th' ? 'ค่าใช้จ่ายล่าสุด' : 'Latest Expenses'}</h2>
                <div className='flex items-center gap-2'>
                    {showDensityToggle && onDensityChange && (
                        <div className='inline-flex h-10 items-center rounded-md border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900'>
                            <button
                                type='button'
                                onClick={() => onDensityChange('compact')}
                                className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                    selectedDensityMode === 'compact' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <List className='h-3.5 w-3.5' />
                                {language === 'th' ? 'กะทัดรัด' : 'Compact'}
                            </button>
                            <button
                                type='button'
                                onClick={() => onDensityChange('comfortable')}
                                className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                    selectedDensityMode === 'comfortable' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <LayoutGrid className='h-3.5 w-3.5' />
                                {language === 'th' ? 'สะดวกสบาย' : getTranslation(language, 'density.comfort')}
                            </button>
                            <button
                                type='button'
                                onClick={() => onDensityChange('auto')}
                                className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                    selectedDensityMode === 'auto' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                                title={getTranslation(language, 'density.autoModeTooltip') + effectiveDensity}
                            >
                                <MonitorCog className='h-3.5 w-3.5' />
                                {language === 'th' ? 'อัตโนมัติ' : getTranslation(language, 'density.auto')}
                            </button>
                            <button
                                type='button'
                                onClick={() => onDensityChange('comfortable')}
                                className='inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer'
                                title={getTranslation(language, 'density.resetTooltip')}
                            >
                                <RotateCcw className='h-3.5 w-3.5' />
                                {language === 'th' ? 'รีเซ็ต' : getTranslation(language, 'density.reset')}
                            </button>
                        </div>
                    )}

                    <div className='relative' ref={exportMenuRef}>
                        <Button type='button' variant='outline'
                            onClick={() => setShowExportMenu((prev) => !prev)}
                            className='h-10 cursor-pointer gap-2'>
                            <Download className='h-4 w-4' />
                            Export CSV
                            <ChevronDown className={`h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </Button>
                        {showExportMenu && (
                            <div className='absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white shadow-lg z-20 p-1 dark:border-slate-700 dark:bg-slate-800'>
                                <button type='button' onClick={() => handleExportLanguageSelect('th')}
                                    className='w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 transition-colors cursor-pointer dark:hover:bg-slate-700'>
                                    Export CSV ไทย (TH)
                                </button>
                                <button type='button' onClick={() => handleExportLanguageSelect('en')}
                                    className='w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 transition-colors cursor-pointer dark:hover:bg-slate-700'>
                                    Export CSV English (EN)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className='mb-4 mt-3 flex flex-wrap items-center gap-2'>
                <div className={`flex flex-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 shadow-xs min-w-45 max-w-sm dark:border-slate-700 dark:bg-slate-900/60 ${effectiveDensity === 'compact' ? 'h-9' : 'h-10'}`}>
                    <Search className='h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5' />
                    <input type='text' placeholder={language === 'th' ? 'ค้นหา...' : 'Search...'} className='outline-none w-full text-sm bg-transparent text-slate-900 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500'
                        value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className='h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'>
                    <option value='all'>{language === 'th' ? 'ทุกหมวดหมู่' : 'All Categories'}</option>
                    {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
                    <DialogTrigger asChild>
                        <Button
                            type='button'
                            variant='outline'
                            className='h-10 px-3 text-sm cursor-pointer'
                        >
                            {language === 'th' ? 'เพิ่มหมวดหมู่' : 'Add Category'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-md'>
                        <DialogHeader>
                            <DialogTitle>{language === 'th' ? 'เพิ่มหมวดหมู่' : 'Add Category'}</DialogTitle>
                            <DialogDescription>
                                {language === 'th' ? 'เพิ่มตัวเลือกหมวดหมู่ใหม่สำหรับกรองค่าใช้จ่าย' : 'Add a new category option for filtering expenses.'}
                            </DialogDescription>
                        </DialogHeader>
                        <Input
                            placeholder={language === 'th' ? 'เช่น สัตว์เลี้ยง' : 'e.g. Pets'}
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            autoFocus
                        />
                        <DialogFooter>
                            <Button
                                type='button'
                                variant='outline'
                                onClick={() => {
                                    setAddCategoryOpen(false);
                                    setNewCategory('');
                                }}
                                className='cursor-pointer'
                            >
                                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                            </Button>
                            <Button
                                type='button'
                                onClick={addCategoryOption}
                                className='cursor-pointer'
                            >
                                {language === 'th' ? 'เพิ่ม' : 'Add'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className={`expenses-grid ${agThemeClass} overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700`}
                style={{ width: '100%', height: gridHeight }}>
                <AgGridReact ref={gridRef} theme='legacy' rowData={rowData} columnDefs={columnDefs}
                    defaultColDef={defaultColDef} quickFilterText={searchInput}
                    rowHeight={rowHeight}
                    pagination={true} paginationPageSize={pageSize} paginationPageSizeSelector={pageSizeOptions}
                    domLayout='normal' animateRows={true}
                    overlayNoRowsTemplate='<span style="padding: 10px; color: #64748b;">No expenses found</span>'
                />
            </div>

            {/* ── Edit Expense Dialog ── */}
            <Dialog open={!!editingExpense} onOpenChange={(v) => { if (!v) setEditingExpense(null); }}>
                <DialogContent className='max-w-md'>
                    <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                        <DialogDescription>Update the details for this expense entry.</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-3 py-1'>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Name</label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                                placeholder='e.g. Coffee'
                            />
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Amount (฿)</label>
                            <Input
                                type='number'
                                min='0'
                                step='any'
                                value={editForm.amount}
                                onChange={(e) => setEditForm(f => ({ ...f, amount: e.target.value }))}
                                placeholder='0'
                            />
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Category</label>
                            <select
                                value={editForm.category}
                                onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))}
                                className='w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 cursor-pointer'
                            >
                                <option value=''>— No Category —</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Date</label>
                            <Input
                                type='date'
                                value={editForm.createdAt}
                                onChange={(e) => setEditForm(f => ({ ...f, createdAt: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type='button' variant='outline' onClick={() => setEditingExpense(null)} className='cursor-pointer'>
                            Cancel
                        </Button>
                        <Button type='button' onClick={saveEdit} disabled={editSaving} className='cursor-pointer'>
                            {editSaving ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ExpensesListTable
