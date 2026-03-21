"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { addNewExpenseAction } from '@/app/_actions/dbActions';
import moment from 'moment';
import { Loader, ScanLine } from 'lucide-react';

function AddExpense({ budgetId, refreshData }) {

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);
    const receiptInputRef = useRef(null);

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
                toast.error(result?.error || 'Receipt scan failed');
                return;
            }

            if (result?.expenseName) {
                setName(result.expenseName);
            }

            if (result?.amount !== null && result?.amount !== undefined) {
                setAmount(String(result.amount));
            }

            toast.success('Receipt scanned with AI');
        } catch (error) {
            console.error('Scan receipt error:', error);
            toast.error('Unable to scan receipt right now');
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
            createdAt: moment().format('DD/MM/YYYY')
        })

        if (result) {
            setLoading(false);
            setName('');
            setAmount(''); // ล้างค่าหลังเพิ่มเสร็จ
            toast.success('New Expense Added!');
            refreshData && refreshData(); // สั่ง refresh ข้อมูลหน้าจอถ้ามี function ส่งมา
        }
        setLoading(false);
    }

    return (
        <div className='border p-5 rounded-lg'>
            <h2 className='font-bold text-lg'>Add Expense</h2>
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
                className='mt-3 w-full bg-linear-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 cursor-pointer text-white'
            >
                {scanLoading ? <Loader className='animate-spin' /> : <ScanLine className='mr-2 h-4 w-4' />}
                {scanLoading ? 'Scanning Receipt...' : 'Scan Receipt with AI'}
            </Button>
            <div className='mt-2'>
                <h2 className='text-black font-medium my-1'>Expense Name</h2>
                <Input placeholder="e.g. Home Decor"
                    autoComplete="on"
                    value={name}
                    onChange={(e) => setName(e.target.value)} />
            </div>
            <div className='mt-2'>
                <h2 className='text-black font-medium my-1'>Expense Amount</h2>
                <Input placeholder="e.g. 1000$"
                    autoComplete="on"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)} />
            </div>
            <Button disabled={!(name && amount || loading || scanLoading)}
                onClick={() => addNewExpense()}

                className='mt-3 w-full bg-amber-600
           hover:bg-amber-700 cursor-pointer'>
                {loading ?
                    <Loader className='animate-spin' /> : "Add New Expense"
                }
            </Button>
        </div>
    )
}

export default AddExpense