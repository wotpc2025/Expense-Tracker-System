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

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const EXPORT_LANGUAGE_OPTIONS = {
    th: {
        label: 'ไทย',
        locale: 'th-TH',
        headers: {
            name: 'ชื่อรายการ',
            amount: 'จำนวนเงิน',
            createdAt: 'วันที่',
        },
    },
    en: {
        label: 'English',
        locale: 'en-US',
        headers: {
            name: 'Name',
            amount: 'Amount',
            createdAt: 'Date',
        },
    },
};

function ExpensesListTable({expensesList, refreshData}) {

 const [searchInput, setSearchInput] = useState('');
 const [showExportMenu, setShowExportMenu] = useState(false);
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
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
 }, []);

 const deleteExpense = useCallback(async (expense) => {
    // เรียกใช้ Server Action
    const result = await deleteExpenseAction(expense.id);

    if (result) {
        toast.success('Expense Deleted!');
        // เรียก refreshData เพื่ออัปเดต UI ทันทีโดยไม่ต้องโหลดหน้าใหม่
        refreshData && refreshData(); 
    }
}, [refreshData]);

    const exportToCSV = useCallback((selectedLanguage) => {
        if (!gridRef.current?.api) {
            return;
        }

        const sanitizeFileNamePart = (value) => {
            return String(value || '')
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9@._-]+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        };

        const userName = sanitizeFileNamePart(user?.fullName || 'user');
        const userEmail = sanitizeFileNamePart(user?.primaryEmailAddress?.emailAddress || 'no-email');
        const languageConfig = EXPORT_LANGUAGE_OPTIONS[selectedLanguage] || EXPORT_LANGUAGE_OPTIONS.th;

        const formatCurrencyForLanguage = (value, locale) => {
            const amount = Number(value || 0);
            return amount.toLocaleString(locale, {
                style: 'currency',
                currency: 'THB',
                minimumFractionDigits: 2,
            });
        };

        const formatDateForLanguage = (value, locale) => {
            if (!value) {
                return '-';
            }

            const parsedDate = moment(value, [
                moment.ISO_8601,
                'YYYY-MM-DD',
                'DD/MM/YYYY',
                'MM/DD/YYYY',
            ], true);

            if (!parsedDate.isValid()) {
                return value;
            }

            return locale === 'th-TH'
                ? parsedDate.format('DD/MM/YYYY')
                : parsedDate.format('MM/DD/YYYY');
        };

        gridRef.current.api.exportDataAsCsv({
            fileName: `expenses-${userName}-${userEmail}-${selectedLanguage}-${moment().format('YYYY-MM-DD')}.csv`,
            columnKeys: ['name', 'amount', 'createdAt'],
            processHeaderCallback: (params) => {
                const colId = params.column.getColId();
                return languageConfig.headers[colId] || colId;
            },
            processCellCallback: (params) => {
                if (params.column.getColId() === 'amount') {
                    return formatCurrencyForLanguage(params.value, languageConfig.locale);
                }

                if (params.column.getColId() === 'createdAt') {
                    return formatDateForLanguage(params.value, languageConfig.locale);
                }

                return params.value;
            },
        });
    }, [user]);

    const handleExportLanguageSelect = useCallback((language) => {
        exportToCSV(language);
        setShowExportMenu(false);
    }, [exportToCSV]);

    const formatCurrencyTHB = useCallback((value) => {
        const amount = Number(value || 0);
        return amount.toLocaleString('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 2,
        });
    }, []);

    const formatExpenseDate = useCallback((value) => {
        if (!value) {
            return '-';
        }

        const parsedDate = moment(value, [
            moment.ISO_8601,
            'YYYY-MM-DD',
            'DD/MM/YYYY',
            'MM/DD/YYYY',
        ], true);

        if (parsedDate.isValid()) {
            return parsedDate.format('DD/MM/YYYY');
        }

        return value;
    }, []);

    const rowData = useMemo(() => {
        return (expensesList || []).map((expense) => ({
            ...expense,
            amount: Number(expense.amount || 0),
        }));
    }, [expensesList]);

    const columnDefs = useMemo(() => [
        {
            headerName: 'Name',
            field: 'name',
            minWidth: 220,
            flex: 1,
            filter: true,
        },
        {
            headerName: 'Amount',
            field: 'amount',
            minWidth: 150,
            initialSort: 'desc',
            valueFormatter: (params) => {
                return formatCurrencyTHB(params.value);
            },
        },
        {
            headerName: 'Date',
            field: 'createdAt',
            minWidth: 170,
            filter: true,
            valueFormatter: (params) => formatExpenseDate(params.value),
        },
        {
            headerName: 'Action',
            field: 'action',
            minWidth: 100,
            sortable: false,
            filter: false,
            suppressCsvExport: true,
            cellRenderer: (params) => (
                <button
                    type='button'
                    onClick={() => deleteExpense(params.data)}
                    className='text-red-600 hover:text-red-800 transition-colors cursor-pointer'
                    aria-label='Delete expense'
                >
                    <Trash className='h-4 w-4' />
                </button>
            ),
        },
    ], [deleteExpense, formatCurrencyTHB, formatExpenseDate]);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        resizable: true,
        filter: true,
        suppressHeaderMenuButton: false,
    }), []);

  return (
    <div className='mt-3'>
        <div className='flex items-center justify-between gap-3 flex-wrap'>
            <h2 className='font-bold text-lg'>Latest Expenses</h2>
            <div className='relative' ref={exportMenuRef}>
                <Button
                    type='button'
                    variant='outline'
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    className='cursor-pointer gap-2'
                >
                    <Download className='h-4 w-4' />
                    Export CSV
                    <ChevronDown className={`h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </Button>

                {showExportMenu && (
                    <div className='absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white shadow-lg z-20 p-1'>
                        <button
                            type='button'
                            onClick={() => handleExportLanguageSelect('th')}
                            className='w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 transition-colors cursor-pointer'
                        >
                            Export ไทย (TH)
                        </button>
                        <button
                            type='button'
                            onClick={() => handleExportLanguageSelect('en')}
                            className='w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 transition-colors cursor-pointer'
                        >
                            Export English (EN)
                        </button>
                    </div>
                )}
            </div>
        </div>
        <div className='p-2 rounded-lg border shadow-sm flex gap-2 mb-3 mt-3 max-w-sm'>
                    <Search className='h-4 w-4 text-slate-500 mt-1' />
                    <input
                        type='text'
                        placeholder='Search...'
                        className='outline-none w-full text-sm'
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                    />
                </div>
                <div className='expenses-grid ag-theme-quartz mt-3 rounded-xl overflow-hidden border border-slate-200' style={{ width: '100%', height: 420 }}>
                    <AgGridReact
                    ref={gridRef}
                        theme='legacy'
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        quickFilterText={searchInput}
                        pagination={true}
                        paginationPageSize={8}
                        paginationPageSizeSelector={[8, 12, 20]}
                        domLayout='normal'
                        animateRows={true}
                        overlayNoRowsTemplate='<span style="padding: 10px; color: #64748b;">No expenses found</span>'
                    />
                </div>
    </div>
  )
}

export default ExpensesListTable