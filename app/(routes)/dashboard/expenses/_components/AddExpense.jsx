"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { addBulkExpensesAction, addNewExpenseAction } from '@/app/_actions/dbActions';
import moment from 'moment';
import { Loader, ScanLine } from 'lucide-react';
import { DEFAULT_EXPENSE_CATEGORIES, normalizeCategoryName } from '@/lib/expenseCategories';

function AddExpense({ budgetId, initialCategory = '', refreshData, density = 'comfortable' }) {

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState(initialCategory || '');
    const [categoryOptions, setCategoryOptions] = useState(DEFAULT_EXPENSE_CATEGORIES);
    const [customCategory, setCustomCategory] = useState('');
    const [scanLoading, setScanLoading] = useState(false);
    const [addingScanned, setAddingScanned] = useState(false);
    const [scannedItems, setScannedItems] = useState([]);
    const [selectedScannedIndexes, setSelectedScannedIndexes] = useState([]);
    const receiptInputRef = useRef(null);

    useEffect(() => {
        const normalized = String(initialCategory || '').trim();
        setCategory(normalized);
        if (normalized) {
            setCategoryOptions((prev) => (
                prev.some((item) => item.toLowerCase() === normalized.toLowerCase())
                    ? prev
                    : [...prev, normalized].sort((a, b) => a.localeCompare(b))
            ));
        }
    }, [initialCategory]);

    const addCustomCategory = () => {
        const nextCategory = normalizeCategoryName(customCategory);
        if (!nextCategory) {
            toast.error('Please enter a category name');
            return;
        }

        const exists = categoryOptions.some((item) => item.toLowerCase() === nextCategory.toLowerCase());
        if (exists) {
            setCategory(nextCategory);
            setCustomCategory('');
            return;
        }

        const updated = [...categoryOptions, nextCategory].sort((a, b) => a.localeCompare(b));
        setCategoryOptions(updated);
        setCategory(nextCategory);
        setCustomCategory('');
        toast.success('Category added');
    };

    const handleReceiptSelection = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setScanLoading(true);
            const formData = new FormData();
            formData.append('receipt', file);

            const response = await fetch('/api/ai/scan-receipt', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result?.userMessage || result?.error || 'สแกนใบเสร็จไม่สำเร็จ');
                return;
            }

            if (result?.expenseName) {
                setName(result.expenseName);
            }

            if (result?.amount !== null && result?.amount !== undefined) {
                setAmount(String(result.amount));
            }

            if (Array.isArray(result?.lineItems) && result.lineItems.length > 0) {
                setScannedItems(result.lineItems);
                setSelectedScannedIndexes(result.lineItems.map((_, index) => index));
            } else {
                setScannedItems([]);
                setSelectedScannedIndexes([]);
            }

            toast.success(Array.isArray(result?.lineItems) && result.lineItems.length > 0
                ? `สแกนสำเร็จ พบ ${result.lineItems.length} รายการ`
                : 'สแกนใบเสร็จสำเร็จ');
        } catch (error) {
            console.error('Scan receipt error:', error);
            toast.error('สแกนใบเสร็จไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setScanLoading(false);
            if (receiptInputRef.current) {
                receiptInputRef.current.value = '';
            }
        }
    };

    const addNewExpense = async () => {
        // เรียกใช้ Server Action
        setLoading(true);
        const result = await addNewExpenseAction({
            name: name,
            amount: amount,
            budgetId: budgetId,
            category: category,
            createdAt: moment().format('DD/MM/YYYY')
        })

        if (result) {
            setLoading(false);
            setName('');
            setCategory('');
            setAmount(''); // ล้างค่าหลังเพิ่มเสร็จ
            toast.success('New Expense Added!');
            refreshData && refreshData(); // สั่ง refresh ข้อมูลหน้าจอถ้ามี function ส่งมา
        }
        setLoading(false);
    }

    const addScannedItems = async () => {
        if (!Array.isArray(scannedItems) || scannedItems.length === 0) {
            toast.error('ยังไม่มีรายการที่สแกนได้');
            return;
        }

        const itemsToAdd = scannedItems.filter((_, index) => selectedScannedIndexes.includes(index));
        if (itemsToAdd.length === 0) {
            toast.error('กรุณาเลือกรายการอย่างน้อย 1 รายการ');
            return;
        }

        try {
            setAddingScanned(true);
            const result = await addBulkExpensesAction({
                budgetId,
                category,
                createdAt: moment().format('DD/MM/YYYY'),
                items: itemsToAdd,
            });

            if (!result?.success) {
                toast.error(result?.error || 'เพิ่มรายการจากใบเสร็จไม่สำเร็จ');
                return;
            }

            toast.success(`เพิ่มรายการจากใบเสร็จแล้ว ${result.count} รายการ`);
            setScannedItems([]);
            setSelectedScannedIndexes([]);
            setName('');
            setAmount('');
            setCategory(String(initialCategory || '').trim());
            setCustomCategory('');
            setCategoryOptions(() => {
                const normalized = String(initialCategory || '').trim();
                if (!normalized) return DEFAULT_EXPENSE_CATEGORIES;
                return DEFAULT_EXPENSE_CATEGORIES.some((item) => item.toLowerCase() === normalized.toLowerCase())
                    ? DEFAULT_EXPENSE_CATEGORIES
                    : [...DEFAULT_EXPENSE_CATEGORIES, normalized].sort((a, b) => a.localeCompare(b));
            });
            refreshData && refreshData();
        } catch (error) {
            console.error('Add scanned items error:', error);
            toast.error('เพิ่มรายการจากใบเสร็จไม่สำเร็จ');
        } finally {
            setAddingScanned(false);
        }
    }

    const toggleScannedItem = (index) => {
        setSelectedScannedIndexes((prev) => {
            if (prev.includes(index)) {
                return prev.filter((value) => value !== index);
            }
            return [...prev, index];
        });
    }

    const toggleSelectAllScanned = () => {
        if (selectedScannedIndexes.length === scannedItems.length) {
            setSelectedScannedIndexes([]);
            return;
        }
        setSelectedScannedIndexes(scannedItems.map((_, index) => index));
    }

    return (
        <div className={`rounded-xl border border-slate-200 bg-white ${density === 'compact' ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'}`}>
            <h2 className='text-lg font-bold sm:text-xl'>Add Expense</h2>
            <input
                ref={receiptInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleReceiptSelection}
            />
            <Button
                type='button'
                onClick={() => receiptInputRef.current?.click()}
                disabled={scanLoading}
                className={`mt-3 w-full cursor-pointer bg-linear-to-r from-fuchsia-500 to-violet-500 text-white hover:from-fuchsia-600 hover:to-violet-600 ${density === 'compact' ? 'h-9' : 'h-10'}`}
            >
                {scanLoading ? <Loader className='animate-spin' /> : <ScanLine className='mr-2 h-4 w-4' />}
                {scanLoading ? 'Scanning Receipt...' : 'Scan Receipt with AI'}
            </Button>

            {scannedItems.length > 0 && (
                <div className='mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3'>
                    <div className='flex items-center justify-between mb-2 gap-2 flex-wrap'>
                        <div>
                            <h3 className='text-sm font-semibold text-slate-700'>Scanned Items ({scannedItems.length})</h3>
                            <p className='text-xs text-slate-500'>Selected: {selectedScannedIndexes.length}</p>
                        </div>
                        <div className='flex gap-2'>
                            <Button
                                type='button'
                                variant='outline'
                                onClick={toggleSelectAllScanned}
                                disabled={addingScanned || scanLoading}
                                className='h-8 px-3 text-xs cursor-pointer'
                            >
                                {selectedScannedIndexes.length === scannedItems.length ? 'Unselect All' : 'Select All'}
                            </Button>
                            <Button
                                type='button'
                                onClick={addScannedItems}
                                disabled={addingScanned || scanLoading || selectedScannedIndexes.length === 0}
                                className='h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                            >
                                {addingScanned ? <Loader className='animate-spin h-3.5 w-3.5' /> : 'Add Selected'}
                            </Button>
                        </div>
                    </div>
                    <div className='max-h-44 space-y-1 overflow-y-auto pr-1'>
                        {scannedItems.map((item, idx) => (
                            <div key={`${item.name}-${idx}`} className='flex items-center justify-between text-xs rounded border bg-white px-2 py-1.5'>
                                <label className='flex items-center gap-2 min-w-0 flex-1 cursor-pointer'>
                                    <input
                                        type='checkbox'
                                        checked={selectedScannedIndexes.includes(idx)}
                                        onChange={() => toggleScannedItem(idx)}
                                    />
                                    <span className='truncate pr-2'>{item.name}</span>
                                </label>
                                <span className='font-semibold'>฿{Number(item.amount || 0).toLocaleString('en-US')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={density === 'compact' ? 'mt-2.5' : 'mt-3'}>
                <h2 className='text-black font-medium my-1'>Expense Name</h2>
                <Input placeholder="e.g. Home Decor"
                    autoComplete="on"
                    value={name}
                    onChange={(e) => setName(e.target.value)} />
            </div>
            <div className={density === 'compact' ? 'mt-2.5' : 'mt-3'}>
                <h2 className='text-black font-medium my-1'>Expense Amount</h2>
                <Input placeholder="e.g. 1000$"
                    autoComplete="on"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className={density === 'compact' ? 'mt-2.5' : 'mt-3'}>
                <h2 className='text-black font-medium my-1'>
                    Category <span className='text-slate-400 text-xs font-normal'>(optional)</span>
                </h2>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full rounded-md border border-input bg-transparent px-3 text-sm ${density === 'compact' ? 'h-9' : 'h-10'}`}
                >
                    <option value=''>Select category</option>
                    {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <div className='mt-2 flex flex-wrap gap-2 sm:flex-nowrap'>
                    <Input
                        placeholder='Add new category'
                        autoComplete='off'
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                    />
                    <Button
                        type='button'
                        variant='outline'
                        onClick={addCustomCategory}
                        className='cursor-pointer whitespace-nowrap'
                    >
                        Add Category
                    </Button>
                </div>
            </div>
            <Button disabled={!(name && amount) || loading || scanLoading}
                onClick={() => addNewExpense()}
                className={`mt-4 w-full bg-amber-600 hover:bg-amber-700 cursor-pointer ${density === 'compact' ? 'h-9' : 'h-10'}`}>
                {loading ?
                    <Loader className='animate-spin' /> : "Add New Expense"
                }
            </Button>
        </div>
    )
}

export default AddExpense