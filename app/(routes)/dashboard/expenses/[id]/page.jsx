"use client"
import React, { useEffect, useState, use } from 'react'
import { useUser } from '@clerk/nextjs'
import { getBudgetInfoAction } from '@/app/_actions/dbActions'
import BudgetItem from '../../budgets/_components/BudgetItem';
import AddExpense from '../_components/AddExpense';
import { getExpensesListAction } from '@/app/_actions/dbActions';
import ExpensesListTable from '../../budgets/_components/ExpensesListTable';

function ExpensesScreen({ params }) {
    const unwrappedParams = use(params);
    const { user, isLoaded } = useUser();
    const [budgetInfo, setBudgetInfo] = useState(null);
    const [expensesList, setExpensesList] = useState([]);
    const [budgetId, setBudgetId] = useState(null);

    const refreshData = () => {
        getBudgetInfo();    // เพื่อให้แถบ Progress Bar อัปเดตยอด Spend
        getExpensesList();  // เพื่อให้ตาราง Latest Expenses อัปเดตรายการใหม่
    }

    useEffect(() => {
        if (isLoaded && user && unwrappedParams?.id) {
            getBudgetInfo();
            getExpensesList(unwrappedParams.id);
        }
    }, [isLoaded, user, unwrappedParams?.id]);

    const getBudgetInfo = async () => {
        // เรียกใช้ Server Action แทนการเขียน db.select ตรงนี้
        const email = user?.primaryEmailAddress?.emailAddress;
        const budgetId = unwrappedParams?.id;

        if (!email || !budgetId) {
            console.warn("Missing email or budgetId:", { email, budgetId });
            return;
        }

        try {
            const result = await getBudgetInfoAction(email, budgetId);
            
            if (result) {
                setBudgetInfo(result); // result เป็น Object ตัวเดียว ไม่ใช่ array
                console.log("Budget Info:", result);
            } else {
                console.warn("No budget info found");
            }
        } catch (error) {
            console.error("Error fetching budget info:", error);
        }
    }

    // Get Latest Expenses
   const getExpensesList = async (id) => {
        // ✅ เรียกผ่าน Server Action แทนการใช้ db โดยตรง
        const result = await getExpensesListAction(id);
        setExpensesList(result);
        console.log("Expenses List:", result);
    }

  return (
    <div className='p-10'>
       <h2 className='text-2xl font-bold'>My Expenses</h2>
       <div className='grid grid-cols-1 md:grid-cols-2 
       mt-6 gap-5'>
            {budgetInfo?<BudgetItem
            budget={budgetInfo} 
            />:
            <div className='h-37.5 w-full bg-slate-200 
            rounded-lg animate-pulse'>
            </div>}
            <AddExpense 
            budgetId={unwrappedParams?.id}
            user={user}
            refreshData={() => {
                getBudgetInfo();
                getExpensesList(unwrappedParams.id);
            }}
            />
        </div>
        <div className='mt-4'>
          <h2 className='font-bold text-lg'>Latest Expenses</h2>   
          <ExpensesListTable 
            expensesList={expensesList} 
            refreshData={() => {
                getBudgetInfo();
                getExpensesList(unwrappedParams.id);
            }}
          />
        </div>  
    </div>
  );
}

export default ExpensesScreen