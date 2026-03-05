"use client"
import React, { useEffect, useState, use } from 'react'
import { useUser } from '@clerk/nextjs'
import { getBudgetInfoAction } from '@/app/_actions/dbActions'
import BudgetItem from '../../budgets/_components/BudgetItem';
import AddExpense from '../_components/AddExpense';

function ExpensesScreen({ params }) {
    const unwrappedParams = use(params);
    const { user, isLoaded } = useUser();
    const [budgetInfo, setBudgetInfo] = useState(null);

    useEffect(() => {
        if (isLoaded && user && unwrappedParams?.id) {
            getBudgetInfo();
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
            <AddExpense budgetId={unwrappedParams?.id}
            user={user}
            refreshData={() => getBudgetInfo() /* ส่งฟังก์ชันรีเฟรชข้อมูลไปให้ AddExpense เพื่อให้มันเรียกใช้หลังเพิ่มข้อมูลใหม่ */ }
            />
        </div>  
    </div>
  );
}

export default ExpensesScreen