"use client"
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import CardInfo from './_components/CardInfo';
import { getAllExpensesAction, getBudgetListAction } from '@/app/_actions/dbActions';
import BarChartDashboard from './_components/BarChartDashboard';
import BudgetItem from './budgets/_components/BudgetItem';
import ExpensesListTable from './budgets/_components/ExpensesListTable';

function Dashboard() {

    const [budgetList, setBudgetList] = useState([]); // สร้าง State ไว้เก็บข้อมูลที่ดึงมา
    const [expensesList, setExpensesList] = useState([]);
    const { user, isLoaded } = useUser();
  
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
        getAllExpensesAction();
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
      console.log("All Expenses:", result);
    }

  return (
    <div className='p-8'>
       <h2 className='font-bold text-3xl'> 
        Welcome, {user?.fullName} ✌️
       </h2>
       <p className='text-gray-500'>Here's what happening with your money, Let's Manage your expenses</p>

       <CardInfo budgetList={budgetList}/>
       <div className='grid grid-cols-1 md:grid-cols-3 mt-6 gap-5'>
          <div className='md:col-span-2'>
            <BarChartDashboard
              budgetList={budgetList}
            />

          
          <ExpensesListTable
            expensesList={expensesList}
            refreshData={()=>getBudgetList()}
          />  

          </div>
          <div className='flex flex-col gap-5 self-start'>
            <h2 className='font-bold text-lg'>Latest Budgets</h2>
            {budgetList.map((budget,index) => (
               <BudgetItem key={index} budget={budget}/>
            ))}
          </div>
       </div>
    </div>
  )
}

export default Dashboard