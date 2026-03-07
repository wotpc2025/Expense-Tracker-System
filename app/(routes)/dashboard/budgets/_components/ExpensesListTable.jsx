import { Trash } from 'lucide-react'
import React from 'react'
import { deleteExpenseAction } from '@/app/_actions/dbActions';
import { toast } from 'sonner';

function ExpensesListTable({expensesList, refreshData}) {

 const deleteExpense = async (expense) => {
    // เรียกใช้ Server Action
    const result = await deleteExpenseAction(expense.id);

    if (result) {
        toast.success('Expense Deleted!');
        // เรียก refreshData เพื่ออัปเดต UI ทันทีโดยไม่ต้องโหลดหน้าใหม่
        refreshData && refreshData(); 
    }
};

  return (
    <div className='mt-3'>
        <div className='grid grid-cols-4 bg-slate-200 p-2 font-bold'>
            <h2 className='font-bold'>Name</h2>   
            <h2 className='font-bold'>Amount</h2>   
            <h2 className='font-bold'>Date</h2>   
            <h2 className='font-bold'>Action</h2>   
        </div>
        {expensesList.map((expenses,index)=> (
        <div key={index} className='grid grid-cols-4 bg-slate-50 p-2 font-bold'>
            <h2>{expenses.name}</h2>   
            <h2>{expenses.amount}</h2>   
            <h2>{expenses.createdAt}</h2>   
            <h2>
                <Trash className='text-red-600 cursor-pointer'
                onClick={()=>deleteExpense(expenses)}  
                />
            </h2>   
        </div>
        ))}
    </div>
  )
}

export default ExpensesListTable