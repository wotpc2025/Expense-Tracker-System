import React from 'react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { addNewExpenseAction } from '@/app/_actions/dbActions';
import moment from 'moment';

function AddExpense({ budgetId, refreshData  }) {

    const [name,setName]=useState('');
    const [amount,setAmount]=useState('');

    const addNewExpense = async () => {
        // เรียกใช้ Server Action
        const result = await addNewExpenseAction({
            name: name,
            amount: amount,
            budgetId: budgetId,
            createdAt:moment().format('DD/MM/YYYY')
        })

        if (result) {
            setName('');
            setAmount(''); // ล้างค่าหลังเพิ่มเสร็จ
            toast.success('New Expense Added!');
            refreshData && refreshData(); // สั่ง refresh ข้อมูลหน้าจอถ้ามี function ส่งมา
        }
    }

  return (
    <div className='border p-5 rounded-lg'>
        <h2 className='font-bold text-lg'>Add Expense</h2>
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
          <Button disabled={!(name && amount)} 
          onClick={() => addNewExpense()}
             
          className='mt-3 w-full bg-amber-600
           hover:bg-amber-700 cursor-pointer'>Add New Expense</Button>
    </div>
  )
}

export default AddExpense