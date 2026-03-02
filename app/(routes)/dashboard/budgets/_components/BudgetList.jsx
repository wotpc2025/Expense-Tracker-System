"use client"
import React, { useEffect, useState } from 'react' // เพิ่ม useState
import CreateBudget from './CreateBudget'
import { useUser } from '@clerk/nextjs'
import { getBudgetListAction } from '@/app/_actions/dbActions' // Import action เข้ามา
import BudgetItem from './BudgetItem'

function BudgetList() {
  
  const [budgetList, setBudgetList] = useState([]); // สร้าง State ไว้เก็บข้อมูลที่ดึงมา
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      getBudgetList();
    }
  }, [user])

  const getBudgetList = async () => {
    // เรียกใช้ Server Action แทนการเขียน db.select ตรงนี้
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    const result = await getBudgetListAction(email);
    setBudgetList(result);

    // log แบบ clean เหมือนในคลิป
    console.log("Budget List Data:", JSON.parse(JSON.stringify(result)));
  }

  return (
    <div className='mt-7'>
          <div className='grid grid-cols-1
          md:grid-cols-2 lg:grid-cols-3 gap-5'>
              <CreateBudget/>
              {budgetList.map((budget,index) => (
                <BudgetItem key={index} budget={budget}/>
              ))}
          </div>
        
    </div>
  )
}

export default BudgetList