"use client"
import React, { useEffect, useState, use } from 'react'
import { useUser } from '@clerk/nextjs'
import { getBudgetInfoAction } from '@/app/_actions/dbActions'
import BudgetItem from '../../budgets/_components/BudgetItem';
import AddExpense from '../_components/AddExpense';
import { getExpensesListAction } from '@/app/_actions/dbActions';
import ExpensesListTable from '../../budgets/_components/ExpensesListTable';
import { MonitorCog, RotateCcw, Trash } from 'lucide-react';
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
import StatCard from '../../_components/StatCard';
import { useDashboardDensity } from '@/lib/useDashboardDensity';



function ExpensesScreen({ params }) {
    const unwrappedParams = use(params);
    const { user, isLoaded } = useUser();
    const [budgetInfo, setBudgetInfo] = useState(null);
    const [expensesList, setExpensesList] = useState([]);
    const [isLoadingBudget, setIsLoadingBudget] = useState(false);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
    const [density, setDensity, resolvedDensity, resetDensity] = useDashboardDensity('dashboard-density', 'comfortable');
    const router =useRouter();

    const totalSpend = Number(budgetInfo?.totalSpend || 0);
    const budgetAmount = Number(budgetInfo?.amount || 0);
    const remaining = Math.max(budgetAmount - totalSpend, 0);
    const totalItems = expensesList?.length || 0;

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
            setIsLoadingBudget(true);
            const result = await getBudgetInfoAction(email, budgetId);
            
            if (result) {
                setBudgetInfo(result); // result เป็น Object ตัวเดียว ไม่ใช่ array
                // console.log("Budget Info:", result);
            } else {
                console.warn("No budget info found");
            }
        } catch (error) {
            console.error("Error fetching budget info:", error);
        } finally {
            setIsLoadingBudget(false);
        }
    }

    // Get Latest Expenses
   const getExpensesList = async (id) => {
        // ✅ เรียกผ่าน Server Action แทนการใช้ db โดยตรง
        try {
            setIsLoadingExpenses(true);
            const result = await getExpensesListAction(id);
            setExpensesList(result);
            // console.log("Expenses List:", result);
        } finally {
            setIsLoadingExpenses(false);
        }
    }

    // ✅ ฟังก์ชันสำหรับลบ Budget พร้อมกับ Expenses ทั้งหมดที่เกี่ยวข้อง
    const deleteBudget = async () => {
        try {
            const result = await deleteBudgetAction(unwrappedParams?.id);
            // console.log("Delete Budget Result:", result);
            toast.success('Budget Deleted!');
            router.push('/dashboard/budgets'); // กลับไปหน้ารายการ Budgets หลังจากลบเสร็จ
        } catch (error) {
            console.error("Error deleting budget:", error);
            toast.error('Failed to delete budget');
        }
    }

  return (
     <section className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
                 <div className='rounded-2xl border bg-linear-to-br from-white to-slate-50 px-4 py-4 shadow-sm sm:px-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900'>
                     <div className='flex flex-wrap items-center justify-between gap-3'>
                         <div>
                             <p className='text-xs font-semibold uppercase tracking-[0.18em] text-amber-600'>Expense Detail</p>
                             <h1 className='mt-1 text-2xl font-bold tracking-tight sm:text-3xl'>My Expenses</h1>
                             <p className='mt-1 text-sm text-slate-500'>Manage budget detail, add expenses, and keep entries clean.</p>
                         </div>
                                    <div className='flex gap-2 items-center'>
                <div className='inline-flex h-10 items-center rounded-md border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900'>
                    <button
                        type='button'
                        onClick={() => setDensity('compact')}
                        className={`rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${density === 'compact' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                    >
                        Compact
                    </button>
                    <button
                        type='button'
                        onClick={() => setDensity('comfortable')}
                        className={`rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${density === 'comfortable' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                    >
                        Comfort
                    </button>
                    <button
                        type='button'
                        onClick={() => setDensity('auto')}
                        className={`rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${density === 'auto' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                        title={`Auto mode is currently ${resolvedDensity}`}
                    >
                        <span className='inline-flex items-center gap-1'>
                          <MonitorCog className='h-3.5 w-3.5' />
                          Auto
                        </span>
                    </button>
                    <button
                        type='button'
                        onClick={resetDensity}
                        className='rounded px-2 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer dark:text-slate-300 dark:hover:bg-slate-700'
                        title='Reset density to default'
                    >
                        <span className='inline-flex items-center gap-1'>
                          <RotateCcw className='h-3.5 w-3.5' />
                          Reset
                        </span>
                    </button>
                </div>
        {budgetInfo && <EditBudget budgetInfo={budgetInfo} refreshData={refreshData} />}
              
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                            <Button className='h-10 gap-2 cursor-pointer hover:bg-red-800' variant="destructive">
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
                     </div>
                 </div>
                    <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                                                <StatCard
                                                    loading={!isLoaded || isLoadingBudget}
                                                    title='Budget Amount'
                                                    value={`฿${budgetAmount.toLocaleString('th-TH')}`}
                                                    caption='Planned capacity'
                                                    formula='budget.amount'
                                                    tone='white'
                                                    points={[budgetAmount * 0.6, budgetAmount * 0.7, budgetAmount * 0.85, budgetAmount]}
                                                />
                                                <StatCard
                                                    loading={!isLoaded || isLoadingBudget || isLoadingExpenses}
                                                    title='Total Spend'
                                                    value={`฿${totalSpend.toLocaleString('th-TH')}`}
                                                    caption='Current usage'
                                                    formula='SUM(expenses.amount by budgetId)'
                                                    tone='slate'
                                                    points={expensesList.slice(-10).map((item) => Number(item?.amount || 0))}
                                                />
                                                <StatCard
                                                    loading={!isLoaded || isLoadingBudget}
                                                    title='Remaining'
                                                    value={`฿${remaining.toLocaleString('th-TH')}`}
                                                    caption='Left to use'
                                                    formula='Budget Amount - Total Spend'
                                                    tone='emerald'
                                                    points={[remaining + 1800, remaining + 1200, remaining + 400, remaining]}
                                                />
                                                <StatCard
                                                    loading={!isLoaded || isLoadingExpenses}
                                                    title='Expense Items'
                                                    value={totalItems}
                                                    caption='Entries in this budget'
                                                    formula='COUNT(expenses in selected budget)'
                                                    tone='amber'
                                                    points={expensesList.slice(-10).map((_, index) => index + 1)}
                                                />
                    </div>
          <div className='mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-5 xl:grid-cols-2'>
            {budgetInfo?<BudgetItem
                        budget={budgetInfo}
                                                density={resolvedDensity}
            />:
              <div className='h-40 w-full rounded-xl bg-slate-200 animate-pulse'>
            </div>}
            <AddExpense 
            budgetId={unwrappedParams?.id}
            initialCategory={budgetInfo?.category || ''}
                                                density={resolvedDensity}
            user={user}
            refreshData={() => {
                getBudgetInfo();
                getExpensesList(unwrappedParams.id);
            }}
            />
        </div>
                <div className='mt-5 sm:mt-6'>
          
          <ExpensesListTable 
            expensesList={expensesList} 
                                                density={resolvedDensity}
                        onDensityChange={setDensity}
                                                showDensityToggle={false}
                        gridHeight='clamp(380px, calc(100vh - 430px), 760px)'
            refreshData={() => {
                getBudgetInfo();
                getExpensesList(unwrappedParams.id);
            }}
          />
        </div>  
        </section>
  );
}

export default ExpensesScreen