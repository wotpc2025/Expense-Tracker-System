"use client"
import React, { useEffect, useState } from 'react' // เพิ่ม useState
import CreateBudget from './CreateBudget'
import { useUser } from '@clerk/nextjs'
import { getBudgetListAction } from '@/app/_actions/dbActions' // Import action เข้ามา
import BudgetItem from './BudgetItem'

function BudgetList() {
  
  const [budgetList, setBudgetList] = useState([]); // สร้าง State ไว้เก็บข้อมูลที่ดึงมา
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      getBudgetList();
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

  return (
    <div className='mt-7'>
          <div className='grid grid-cols-1
          md:grid-cols-2 lg:grid-cols-3 gap-5'>
              <CreateBudget
              refreshData={getBudgetList}/>
              {budgetList?.length > 0? budgetList.map((budget,index) => (
                <BudgetItem budget={budget} key={index}/>
              ))
            :[1,2,3,4,5].map((item,index) => (
              <div key={index} className='w-full bg-slate-200 rounded-lg 
              h-36 animate-pulse'>

              </div>
            ))
            }
          </div>
        
    </div>
  )
}

export default BudgetList