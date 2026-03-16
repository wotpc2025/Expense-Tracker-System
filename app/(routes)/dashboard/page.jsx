"use client"
import { UserButton, useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import CardInfo from './_components/CardInfo';
import { getBudgetListAction } from '@/app/_actions/dbActions';

function Dashboard() {

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
    <div className='p-8'>
       <h2 className='font-bold text-3xl'> 
        Welcome, {user?.fullName} ✌️
       </h2>
       <p className='text-gray-500'>Here's what happening with your money, Let's Manage your expenses</p>

       <CardInfo budgetList={budgetList}/>
    </div>
  )
}

export default Dashboard