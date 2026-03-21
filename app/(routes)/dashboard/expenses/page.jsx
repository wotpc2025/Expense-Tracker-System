"use client"

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getAllExpensesAction } from '@/app/_actions/dbActions'
import ExpensesListTable from '../budgets/_components/ExpensesListTable'

function ExpensesPage() {
  const { user, isLoaded } = useUser();
  const [expensesList, setExpensesList] = useState([]);

  useEffect(() => {
    if (isLoaded && user) {
      getAllExpenses();
    }
  }, [isLoaded, user]);

  const getAllExpenses = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    const result = await getAllExpensesAction(email);
    setExpensesList(result || []);
  };

  return (
    <div className='p-10'>
      <h2 className='text-2xl font-bold'>My Expenses List</h2>
      <ExpensesListTable
        expensesList={expensesList}
        refreshData={getAllExpenses}
        gridHeight='clamp(420px, calc(100vh - 260px), 820px)'
      />
    </div>
  )
}

export default ExpensesPage
