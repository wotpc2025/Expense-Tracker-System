"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Download, Search, Trash } from 'lucide-react'
import moment from 'moment';
import { useUser } from '@clerk/nextjs';
import { deleteExpenseAction } from '@/app/_actions/dbActions';
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

function ExpensesListTable({ expensesList, refreshData, gridHeight = '420px' }) {

    const [searchInput, setSearchInput] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [customCategories, setCustomCategories] = useState([]);
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const gridRef = useRef(null);
    const exportMenuRef = useRef(null);
    const { user } = useUser();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, []);

    const deleteExpense = useCallback(async (expense) => {
        const result = await deleteExpenseAction(expense.id);
        if (result) {
            toast.success('Expense Deleted!');
            refreshData && refreshData();
        }
    }, [refreshData]);

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
            const parsedDate = moment(value, [moment.ISO_8601, 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'], true);
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
        { headerName: 'Name', field: 'name', minWidth: 200, flex: 1, filter: true },
        {
            headerName: 'Category', field: 'category', minWidth: 145,
            cellRenderer: (params) => {
                if (!params.value) return <span className='text-slate-400 text-xs'>—</span>;
                const color = getCategoryColor(params.value);
                return (
                    <span style={{ backgroundColor: color, color: '#fff' }}
                        className='px-2 py-0.5 rounded-full text-xs font-semibold'>
                        {params.value}
                    </span>
                );
            },
        },
        {
            headerName: 'Amount', field: 'amount', minWidth: 150, initialSort: 'desc',
            valueFormatter: (params) => formatCurrencyTHB(params.value),
        },
        {
            headerName: 'Date', field: 'createdAt', minWidth: 140, filter: true,
            valueFormatter: (params) => formatExpenseDate(params.value),
        },
        {
            headerName: 'Action', field: 'action', minWidth: 90, sortable: false,
            filter: false, suppressCsvExport: true,
            cellRenderer: (params) => (
                <button type='button' onClick={() => deleteExpense(params.data)}
                    className='text-red-600 hover:text-red-800 transition-colors cursor-pointer'
                    aria-label='Delete expense'>
                    <Trash className='h-4 w-4' />
                </button>
            ),
        },
    ], [deleteExpense, formatCurrencyTHB, formatExpenseDate]);

    const defaultColDef = useMemo(() => ({
        sortable: true, resizable: true, filter: true, suppressHeaderMenuButton: false,
    }), []);

    return (
        <div className='mt-3'>
            <div className='flex items-center justify-between gap-3 flex-wrap'>
                <h2 className='font-bold text-lg'>Latest Expenses</h2>
                <div className='relative' ref={exportMenuRef}>
                    <Button type='button' variant='outline'
                        onClick={() => setShowExportMenu((prev) => !prev)}
                        className='cursor-pointer gap-2'>
                        <Download className='h-4 w-4' />
                        Export CSV
                        <ChevronDown className={`h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                    </Button>
                    {showExportMenu && (
                        <div className='absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white shadow-lg z-20 p-1'>
                            <button type='button' onClick={() => handleExportLanguageSelect('th')}
                                className='w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 transition-colors cursor-pointer'>
                                Export ไทย (TH)
                            </button>
                            <button type='button' onClick={() => handleExportLanguageSelect('en')}
                                className='w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 transition-colors cursor-pointer'>
                                Export English (EN)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className='flex gap-2 mt-3 mb-3 flex-wrap items-center'>
                <div className='p-2 rounded-lg border shadow-sm flex gap-2 flex-1 min-w-45 max-w-sm'>
                    <Search className='h-4 w-4 text-slate-500 mt-0.5' />
                    <input type='text' placeholder='Search...' className='outline-none w-full text-sm'
                        value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className='border rounded-lg px-3 py-2 text-sm cursor-pointer bg-white h-10'>
                    <option value='all'>All Categories</option>
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
                            Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-md'>
                        <DialogHeader>
                            <DialogTitle>Add Category</DialogTitle>
                            <DialogDescription>
                                Add a new category option for filtering expenses.
                            </DialogDescription>
                        </DialogHeader>
                        <Input
                            placeholder='e.g. Pets'
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
                                Cancel
                            </Button>
                            <Button
                                type='button'
                                onClick={addCategoryOption}
                                className='cursor-pointer'
                            >
                                Add
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className='expenses-grid ag-theme-quartz rounded-xl overflow-hidden border border-slate-200'
                style={{ width: '100%', height: gridHeight }}>
                <AgGridReact ref={gridRef} theme='legacy' rowData={rowData} columnDefs={columnDefs}
                    defaultColDef={defaultColDef} quickFilterText={searchInput}
                    pagination={true} paginationPageSize={8} paginationPageSizeSelector={[8, 12, 20]}
                    domLayout='normal' animateRows={true}
                    overlayNoRowsTemplate='<span style="padding: 10px; color: #64748b;">No expenses found</span>'
                />
            </div>
        </div>
    )
}

export default ExpensesListTable
