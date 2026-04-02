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
import { useLanguage } from '@/app/(routes)/dashboard/_providers/LanguageProvider';
import { getTranslation } from '@/lib/translations';

function AddExpense({ budgetId, initialCategory = '', refreshData, density = 'comfortable', initialScanResult = null }) {
    const { language } = useLanguage();

    const [name, setName] = useState(initialScanResult?.expenseName || '');
    const [amount, setAmount] = useState(initialScanResult?.amount != null ? String(initialScanResult.amount) : '');
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState(initialCategory || '');
    const [categoryOptions, setCategoryOptions] = useState(DEFAULT_EXPENSE_CATEGORIES);
    const [customCategory, setCustomCategory] = useState('');
    const [scanLoading, setScanLoading] = useState(false);
    const [addingScanned, setAddingScanned] = useState(false);
    const [scannedItems, setScannedItems] = useState(Array.isArray(initialScanResult?.lineItems) ? initialScanResult.lineItems : []);
    const [selectedScannedIndexes, setSelectedScannedIndexes] = useState(
        Array.isArray(initialScanResult?.lineItems) ? initialScanResult.lineItems.map((_, i) => i) : []
    );
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
            toast.error(getTranslation(language, 'addExpense.toasts.enterCategoryName'));
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
        toast.success(getTranslation(language, 'addExpense.toasts.categoryAdded'));
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
                toast.error(result?.userMessage || result?.error || getTranslation(language, 'addExpense.toasts.scanRetry'));
                return;
            }

            if (Array.isArray(result?.lineItems) && result.lineItems.length > 0) {
                // Only show line items to prevent accidental double-adding of aggregate + items
                setScannedItems(result.lineItems);
                setSelectedScannedIndexes(result.lineItems.map((_, index) => index));
                toast.success(
                    getTranslation(language, 'addExpense.toasts.scanFound').replace('{count}', String(result.lineItems.length))
                );
            } else {
                toast.error(getTranslation(language, 'addExpense.toasts.scanNoItems'));
                setScannedItems([]);
                setSelectedScannedIndexes([]);
            }
        } catch (error) {
            console.error('Scan receipt error:', error);
            toast.error(getTranslation(language, 'addExpense.toasts.scanRetry'));
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
            toast.success(getTranslation(language, 'addExpense.toasts.addSuccess'));
            refreshData && refreshData(); // สั่ง refresh ข้อมูลหน้าจอถ้ามี function ส่งมา
        }
        setLoading(false);
    }

    const addScannedItems = async () => {
        if (!Array.isArray(scannedItems) || scannedItems.length === 0) {
            toast.error(getTranslation(language, 'addExpense.toasts.noScannedItems'));
            return;
        }

        const itemsToAdd = scannedItems.filter((_, index) => selectedScannedIndexes.includes(index));
        if (itemsToAdd.length === 0) {
            toast.error(getTranslation(language, 'addExpense.toasts.selectAtLeastOne'));
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
                toast.error(result?.error || getTranslation(language, 'addExpense.toasts.addMultipleFailed'));
                return;
            }

            toast.success(
                getTranslation(language, 'addExpense.toasts.addMultipleSuccess').replace('{count}', String(result.count))
            );
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
            toast.error(getTranslation(language, 'addExpense.toasts.addMultipleFailed'));
        } finally {
            setAddingScanned(false);
        }
    }

    const updateScannedItemName = (index, value) => {
        setScannedItems((prev) => prev.map((item, idx) => (
            idx === index
                ? { ...item, name: value }
                : item
        )));
    }

    const updateScannedItemAmount = (index, value) => {
        const parsed = Number(value);
        setScannedItems((prev) => prev.map((item, idx) => (
            idx === index
                ? { ...item, amount: Number.isFinite(parsed) ? parsed : 0 }
                : item
        )));
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

    const clearScan = () => {
        setScannedItems([]);
        setSelectedScannedIndexes([]);
        setName('');
        setAmount('');
        setCategory(String(initialCategory || '').trim());
        setCustomCategory('');
    }

    return (
        <div className={`rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 ${density === 'compact' ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'}`}>
            <div className='flex items-center justify-between gap-2 mb-2'>
                <h2 className='text-lg font-bold sm:text-xl'>{getTranslation(language, 'addExpense.addExpense')}</h2>
                {scannedItems.length > 0 && (
                    <Button
                        type='button'
                        variant='outline'
                        onClick={clearScan}
                        disabled={addingScanned}
                        className='h-8 px-3 text-xs cursor-pointer'
                    >
                        {getTranslation(language, 'addExpense.clearScan')}
                    </Button>
                )}
            </div>
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
                disabled={scanLoading || scannedItems.length > 0}
                className={`mt-3 w-full cursor-pointer bg-linear-to-r from-fuchsia-500 to-violet-500 text-white hover:from-fuchsia-600 hover:to-violet-600 disabled:opacity-50 ${density === 'compact' ? 'h-9' : 'h-10'}`}
            >
                {scanLoading ? <Loader className='animate-spin' /> : <ScanLine className='mr-2 h-4 w-4' />}
                {scanLoading ? getTranslation(language, 'addExpense.scanning') : getTranslation(language, 'addExpense.scanReceipt')}
            </Button>

            {scannedItems.length > 0 && (
                <div className='mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/30 dark:bg-emerald-900/20'>
                    <p className='text-sm text-emerald-700 dark:text-emerald-300 font-medium'>
                        {getTranslation(language, 'addExpense.scanHint')}
                    </p>
                </div>
            )}

            {scannedItems.length > 0 && (
                <div className='mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50'>
                    <div className='flex items-center justify-between mb-2 gap-2 flex-wrap'>
                        <div>
                            <h3 className='text-sm font-semibold text-slate-700 dark:text-slate-300'>
                                {getTranslation(language, 'addExpense.scannedItems')} ({scannedItems.length})
                            </h3>
                            <p className='text-xs text-slate-500'>
                                {getTranslation(language, 'addExpense.selectedCount').replace('{count}', String(selectedScannedIndexes.length))}
                            </p>
                        </div>
                        <div className='flex gap-2'>
                            <Button
                                type='button'
                                variant='outline'
                                onClick={toggleSelectAllScanned}
                                disabled={addingScanned || scanLoading}
                                className='h-8 px-3 text-xs cursor-pointer'
                            >
                                {selectedScannedIndexes.length === scannedItems.length
                                    ? getTranslation(language, 'addExpense.unselectAll')
                                    : getTranslation(language, 'addExpense.selectAll')}
                            </Button>
                            <Button
                                type='button'
                                onClick={addScannedItems}
                                disabled={addingScanned || scanLoading || selectedScannedIndexes.length === 0}
                                className='h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                            >
                                {addingScanned ? <Loader className='animate-spin h-3.5 w-3.5' /> : getTranslation(language, 'addExpense.addSelected')}
                            </Button>
                        </div>
                    </div>
                    <div className='max-h-44 space-y-1 overflow-y-auto pr-1'>
                        {scannedItems.map((item, idx) => (
                            <div key={`${item.name}-${idx}`} className='rounded border bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800'>
                                <div className='flex items-center justify-between text-xs'>
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

                                <div className='mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2'>
                                    <Input
                                        value={item.name || ''}
                                        onChange={(e) => updateScannedItemName(idx, e.target.value)}
                                        placeholder={getTranslation(language, 'addExpense.editItemName')}
                                        className='h-8 text-xs'
                                    />
                                    <input
                                        type='number'
                                        value={Number(item.amount || 0)}
                                        onChange={(e) => updateScannedItemAmount(idx, e.target.value)}
                                        className='h-8 rounded-md border border-input bg-transparent px-3 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
                                        placeholder={getTranslation(language, 'addExpense.editItemAmount')}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {scannedItems.length === 0 && (
                <>
                    <div className={density === 'compact' ? 'mt-2.5' : 'mt-3'}>
                        <h2 className='text-black font-medium my-1 dark:text-white'>{getTranslation(language, 'addExpense.expenseName')}</h2>
                        <Input placeholder={getTranslation(language, 'placeholder.expenseName')}
                            autoComplete="on"
                            value={name}
                            onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className={density === 'compact' ? 'mt-2.5' : 'mt-3'}>
                        <h2 className='text-black font-medium my-1 dark:text-white'>{getTranslation(language, 'addExpense.expenseAmount')}</h2>
                        <Input placeholder={getTranslation(language, 'placeholder.expenseAmount')}
                            autoComplete="on"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div className={density === 'compact' ? 'mt-2.5' : 'mt-3'}>
                        <h2 className='text-black font-medium my-1 dark:text-white'>
                            {getTranslation(language, 'addExpense.category')}
                        </h2>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={`w-full rounded-md border border-input bg-transparent px-3 text-sm dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 ${density === 'compact' ? 'h-9' : 'h-10'}`}
                        >
                            <option value=''>{getTranslation(language, 'addExpense.selectCategory')}</option>
                            {categoryOptions.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <div className='mt-2 flex flex-wrap gap-2 sm:flex-nowrap'>
                            <Input
                                placeholder={getTranslation(language, 'addExpense.newCategory')}
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
                                {getTranslation(language, 'addExpense.addNewCategory')}
                            </Button>
                        </div>
                    </div>
                    <Button disabled={!(name && amount) || loading || scanLoading}
                        onClick={() => addNewExpense()}
                        className={`mt-4 w-full bg-amber-600 hover:bg-amber-700 cursor-pointer ${density === 'compact' ? 'h-9' : 'h-10'}`}>
                        {loading ?
                            <Loader className='animate-spin' /> : getTranslation(language, 'addExpense.addButton')
                        }
                    </Button>
                </>
            )}
        </div>
    )
}

export default AddExpense