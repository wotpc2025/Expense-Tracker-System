"use client"

import { useCallback, useMemo, useState } from 'react'
import { Search, Trash } from 'lucide-react'
import { deleteExpenseAction } from '@/app/_actions/dbActions';
import { toast } from 'sonner';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([AllCommunityModule]);

function ExpensesListTable({expensesList, refreshData}) {

 const [searchInput, setSearchInput] = useState('');

 const deleteExpense = useCallback(async (expense) => {
    // เรียกใช้ Server Action
    const result = await deleteExpenseAction(expense.id);

    if (result) {
        toast.success('Expense Deleted!');
        // เรียก refreshData เพื่ออัปเดต UI ทันทีโดยไม่ต้องโหลดหน้าใหม่
        refreshData && refreshData(); 
    }
}, [refreshData]);

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
                const value = Number(params.value || 0);
                return value.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                });
            },
        },
        {
            headerName: 'Date',
            field: 'createdAt',
            minWidth: 170,
            filter: true,
        },
        {
            headerName: 'Action',
            field: 'action',
            minWidth: 100,
            sortable: false,
            filter: false,
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
    ], [deleteExpense]);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        resizable: true,
        filter: true,
                suppressHeaderMenuButton: false,
    }), []);

  return (
    <div className='mt-3'>
        <h2 className='font-bold text-lg'>Latest Expenses</h2>   
                <div className='p-2 rounded-lg border shadow-sm flex gap-2 mb-3 max-w-sm'>
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