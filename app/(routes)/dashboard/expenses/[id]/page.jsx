"use client"
import React, { useEffect, useState, use } from 'react'
import { useUser } from '@clerk/nextjs'
import { getBudgetInfoAction } from '@/app/_actions/dbActions'
import BudgetItem from '../../budgets/_components/BudgetItem';
import AddExpense from '../_components/AddExpense';
import { getExpensesListAction } from '@/app/_actions/dbActions';
import ExpensesListTable from '../../budgets/_components/ExpensesListTable';
import { Trash, PenBox} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteBudgetAction } from '@/app/_actions/dbActions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import EditBudget from '../../_components/EditBudget';



function ExpensesScreen({ params }) {
    const unwrappedParams = use(params);
    const { user, isLoaded } = useUser();
    const [budgetInfo, setBudgetInfo] = useState(null);
    const [expensesList, setExpensesList] = useState([]);
    const router =useRouter();

    const refreshData = () => {
        getBudgetInfo();    // เพื่อให้แถบ Progress Bar อัปเดตยอด Spend
        getExpensesList(unwrappedParams?.id);  // เพื่อให้ตาราง Latest Expenses อัปเดตรายการใหม่
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

    // ✅ ฟังก์ชันสำหรับลบ Budget พร้อมกับ Expenses ทั้งหมดที่เกี่ยวข้อง
    const deleteBudget = async () => {
        try {
            const result = await deleteBudgetAction(unwrappedParams?.id);
            console.log("Delete Budget Result:", result);
            toast.success('Budget Deleted!');
            router.push('/dashboard/budgets'); // กลับไปหน้ารายการ Budgets หลังจากลบเสร็จ
        } catch (error) {
            console.error("Error deleting budget:", error);
            toast.error('Failed to delete budget');
        }
    }

  return (
    <div className='p-10'>
       <h2 className='text-2xl font-bold flex justify-between items-center'>My Expenses
              <div className='flex gap-2 items-center'>
        {budgetInfo && <EditBudget budgetInfo={budgetInfo} refreshData={refreshData} />}
              
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button className='flex gap-2 cursor-pointer hover:bg-red-800' variant="destructive">
                        <Trash/> Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent suppressHydrationWarning>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your current budget along with expenses
                              and remove your data from our servers.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() =>deleteBudget()}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              </div>
              
       </h2>
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