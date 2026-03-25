"use client"
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import CardInfo from './_components/CardInfo';
import { getAllExpensesAction, getBudgetListAction } from '@/app/_actions/dbActions';
import BarChartDashboard from './_components/BarChartDashboard';
import BudgetItem from './budgets/_components/BudgetItem';
import ExpensesListTable from './budgets/_components/ExpensesListTable';
import { useLanguage } from './_providers/LanguageProvider'
import { getTranslation } from '@/lib/translations'

function Dashboard() {

    const [budgetList, setBudgetList] = useState([]);
    const [expensesList, setExpensesList] = useState([]);
    const { user, isLoaded } = useUser();
    const { language } = useLanguage();
  
    useEffect(() => {
      if (isLoaded && user) {
        getBudgetList();
      }
    }, [isLoaded, user])

    useEffect(() => {
      if (isLoaded && user) {
        getAllExpenses();
      }
    }, [isLoaded, user])
  
    const getBudgetList = async () => {
      // เรียกใช้ Server Action แทนการเขียน db.select ตรงนี้
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) {
        console.warn("Email not available");
        return;
      }
  
      const result = await getBudgetListAction(email);
      if (result && result.length > 0) {
        setBudgetList(result);
      } else {
        setBudgetList([]);
      }
  
      // log ข้อมูลที่ได้มาเพื่อเช็คว่า Server Action ทำงานถูกต้องหรือไม่
      //console.log("Budget List Data:", JSON.parse(JSON.stringify(result)));
    }

    // ✅ ฟังก์ชันสำหรับดึงรายการค่าใช้จ่าย (Expenses) ทั้งหมด ของผู้ใช้ตาม Email (สำหรับหน้า Dashboard)
    // เรียกใช้ Server Action แทนการเขียน db.select 
    const getAllExpenses = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;
      const result = await getAllExpensesAction(email);
      setExpensesList(result);
      // console.log("All Expenses:", result);
    }

  return (
    <section className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
       <div className='rounded-2xl border bg-linear-to-br from-white to-slate-50 px-4 py-4 shadow-sm sm:px-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900'>
         <p className='text-xs font-semibold uppercase tracking-[0.18em] text-amber-600'>{getTranslation(language, 'dashboard.title')} Overview</p>
         <h1 className='mt-1 text-2xl font-bold tracking-tight sm:text-3xl'>{getTranslation(language, 'dashboard.welcome')}, {user?.fullName} ✌️</h1>
         <p className='mt-1 text-sm text-slate-500'>{getTranslation(language, 'dashboard.title')}</p>
       </div>

       <CardInfo budgetList={budgetList}/>
       <div className='mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3'>
          <div className='xl:col-span-2'>
            <BarChartDashboard
              budgetList={budgetList}
            />

          
          <ExpensesListTable
            expensesList={expensesList}
            gridHeight='clamp(420px, calc(100vh - 260px), 820px)'
            refreshData={getAllExpenses}
          />  

          </div>
          <div className='flex flex-col gap-5 self-start'>
            <h2 className='text-lg font-bold'>Latest Budgets</h2>
            {budgetList.slice(0, 4).map((budget,index) => (
               <BudgetItem key={index} budget={budget}/>
            ))}
          </div>
       </div>
    </section>
  )
}

export default Dashboard