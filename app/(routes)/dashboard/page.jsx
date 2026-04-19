"use client"
/**
 * dashboard/page.jsx — Main Dashboard Page
 *
 * The primary view for regular users after sign-in. Shows:
 *   - Date filter toolbar (month / date range / all time)
 *   - CardInfo: 3 summary stat cards (total budget, total spend, active budgets)
 *   - BarChartDashboard: budget vs. spend bar chart
 *   - BudgetItem grid: card per budget with spend progress
 *   - ExpensesListTable: recent expenses table
 *
 * Data flow:
 *   - getBudgetListAction(email)   → budgetList state
 *   - getAllExpensesAction(email)   → expensesList state
 *   - Both are filtered client-side by the active dateFilter (no server round-trip)
 *
 * Admin redirect:
 *   - After Clerk loads, getCurrentUserAdminStatusAction() is called.
 *   - If the user is an admin they are immediately redirected to /dashboard/admin.
 *
 * Dependencies: moment.js for date parsing, useDashboardDateFilter for
 * shared filter state that syncs with BudgetList and ExpensesPage tabs.
 */
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useMemo, useState } from 'react'
import CardInfo from './_components/CardInfo';
import { getAllExpensesAction, getBudgetListAction, getCurrentUserAdminStatusAction } from '@/app/_actions/dbActions';
import BarChartDashboard from './_components/BarChartDashboard';
import BudgetItem from './budgets/_components/BudgetItem';
import ExpensesListTable from './budgets/_components/ExpensesListTable';
import { t } from '@/lib/text'
import { useRouter } from 'next/navigation';
import { isAdminByRole } from '@/lib/adminAccess';
import { useDashboardDateFilter } from '@/lib/useDashboardDateFilter'
import moment from 'moment'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarDays } from 'lucide-react'

function Dashboard() {

    const [budgetList, setBudgetList] = useState([]);
    const [expensesList, setExpensesList] = useState([]);
  const [isBudgetLoading, setIsBudgetLoading] = useState(true);
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const language = 'en';
    const [isAdmin, setIsAdmin] = useState(false)
    const [isAdminResolved, setIsAdminResolved] = useState(false)
    const {
      dateFilterMode,
      setDateFilterMode,
      selectedMonth,
      setSelectedMonth,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
    } = useDashboardDateFilter(moment().format('YYYY-MM'))
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
    const [isStartPickerOpen, setIsStartPickerOpen] = useState(false)
    const [isEndPickerOpen, setIsEndPickerOpen] = useState(false)
    const [startPickerMonth, setStartPickerMonth] = useState(() => moment().toDate())
    const [endPickerMonth, setEndPickerMonth] = useState(() => moment().toDate())

    const parseDate = (dateStr) => {
      if (!dateStr) return null
      const formats = ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'YYYY/MM/DD', 'DD-MM-YYYY']
      for (const fmt of formats) {
        const m = moment(dateStr, fmt, true)
        if (m.isValid()) return m
      }
      const m = moment(dateStr)
      return m.isValid() ? m : null
    }

    useEffect(() => {
      if (!isLoaded || !user) return;

      let isActive = true

      setIsAdmin(isAdminByRole(user))

      getCurrentUserAdminStatusAction()
        .then((result) => {
          if (!isActive) return
          const nextIsAdmin = Boolean(result)
          setIsAdmin(nextIsAdmin)
          setIsAdminResolved(true)
          if (nextIsAdmin) {
            router.replace('/dashboard/admin')
          }
        })
        .catch(() => {
          if (!isActive) return
          setIsAdminResolved(true)
        })

      return () => {
        isActive = false
      }
    }, [isLoaded, user, router]);
  
    useEffect(() => {
      if (isLoaded && user && isAdminResolved && !isAdmin) {
        getBudgetList();
      }
    }, [isLoaded, user, isAdminResolved, isAdmin])

    useEffect(() => {
      if (isLoaded && user && isAdminResolved && !isAdmin) {
        getAllExpenses();
      }
    }, [isLoaded, user, isAdminResolved, isAdmin])
  
    const getBudgetList = async () => {
      setIsBudgetLoading(true);
      // เรียกใช้ Server Action แทนการเขียน db.select ตรงนี้
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) {
        console.warn("Email not available");
        setIsBudgetLoading(false);
        return;
      }

      try {
        const result = await getBudgetListAction(email);
        if (result && result.length > 0) {
          setBudgetList(result);
        } else {
          setBudgetList([]);
        }
      } finally {
        setIsBudgetLoading(false);
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

    const filteredExpenses = useMemo(() => {
      if (dateFilterMode === 'all') return expensesList

      if (dateFilterMode === 'month') {
        return expensesList.filter((e) => {
          const m = parseDate(e.createdAt)
          return m && m.format('YYYY-MM') === selectedMonth
        })
      }

      const from = startDate ? moment(startDate, 'YYYY-MM-DD', true).startOf('day') : null
      const to = endDate ? moment(endDate, 'YYYY-MM-DD', true).endOf('day') : null

      return expensesList.filter((e) => {
        const m = parseDate(e.createdAt)
        if (!m) return false
        if (from && m.isBefore(from)) return false
        if (to && m.isAfter(to)) return false
        return true
      })
    }, [expensesList, dateFilterMode, selectedMonth, startDate, endDate])

    const periodLabel = (() => {
      if (dateFilterMode === 'all') return language === 'th' ? 'ทุกช่วงเวลา' : 'All time'

      if (dateFilterMode === 'month') {
        return moment(selectedMonth, 'YYYY-MM', true)
          .locale(language === 'th' ? 'th' : 'en')
          .format('MMMM YYYY')
      }

      if (!startDate && !endDate) return language === 'th' ? 'ช่วงวันที่ทั้งหมด' : 'Any date range'
      if (startDate && endDate) {
        const from = moment(startDate, 'YYYY-MM-DD', true).locale(language === 'th' ? 'th' : 'en').format('D MMM YYYY')
        const to = moment(endDate, 'YYYY-MM-DD', true).locale(language === 'th' ? 'th' : 'en').format('D MMM YYYY')
        return `${from} - ${to}`
      }
      if (startDate) {
        const from = moment(startDate, 'YYYY-MM-DD', true).locale(language === 'th' ? 'th' : 'en').format('D MMM YYYY')
        return `${language === 'th' ? 'ตั้งแต่' : 'From'} ${from}`
      }
      const to = moment(endDate, 'YYYY-MM-DD', true).locale(language === 'th' ? 'th' : 'en').format('D MMM YYYY')
      return `${language === 'th' ? 'ถึง' : 'Until'} ${to}`
    })()

    const budgetSpendById = useMemo(() => {
      const map = {}
      filteredExpenses.forEach((expense) => {
        const budgetId = Number(expense?.budgetId)
        if (!budgetId) return
        map[budgetId] = (map[budgetId] || 0) + Number(expense?.amount || 0)
      })
      return map
    }, [filteredExpenses])

    const activeBudgetIds = useMemo(() => {
      return new Set(
        filteredExpenses
          .map((expense) => Number(expense?.budgetId))
          .filter((id) => Number.isInteger(id) && id > 0)
      )
    }, [filteredExpenses])

    const filteredBudgetList = useMemo(() => {
      const baseList = dateFilterMode === 'all'
        ? budgetList
        : budgetList.filter((budget) => activeBudgetIds.has(Number(budget.id)))

      return baseList.map((budget) => ({
        ...budget,
        totalSpend: Number(budgetSpendById[budget.id] || 0),
      }))
    }, [budgetList, budgetSpendById, activeBudgetIds, dateFilterMode])

  return (
    <section className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
       <div className='rounded-2xl border bg-linear-to-br from-white to-slate-50 px-4 py-4 shadow-sm sm:px-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900'>
         <p className='text-xs font-semibold uppercase tracking-[0.18em] text-amber-600'>{t('dashboard.title')} Overview</p>
         <h1 className='mt-1 text-2xl font-bold tracking-tight sm:text-3xl'>{t('dashboard.welcome')}, {user?.fullName} ✌️</h1>
         <p className='mt-1 text-sm text-slate-500'>{t('dashboard.title')} - {periodLabel}</p>
       </div>

       <div className='mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
        <div className='flex flex-wrap items-end gap-3'>
          <div className='w-full min-w-37.5 sm:w-auto'>
            <label className='mb-1 block text-xs font-medium text-slate-500'>
              {language === 'th' ? 'โหมดวันที่' : 'Date mode'}
            </label>
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value)}
              className='h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            >
              <option value='month'>{language === 'th' ? 'รายเดือน' : 'By month'}</option>
              <option value='range'>{language === 'th' ? 'ช่วงวันที่' : 'Date range'}</option>
              <option value='all'>{language === 'th' ? 'ทุกช่วงเวลา' : 'All time'}</option>
            </select>
          </div>

          {dateFilterMode === 'month' && (
            <div className='w-full min-w-37.5 sm:w-auto'>
              <label className='mb-1 block text-xs font-medium text-slate-500'>
                {language === 'th' ? 'เลือกเดือน' : 'Select month'}
              </label>
              <Popover open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='h-10 w-full justify-between border-slate-300 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  >
                    <span>
                      {moment(`${selectedMonth}-01`, 'YYYY-MM-DD', true)
                        .locale(language === 'th' ? 'th' : 'en')
                        .format('MMMM YYYY')}
                    </span>
                    <CalendarDays className='h-4 w-4 opacity-70' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={moment(`${selectedMonth}-01`, 'YYYY-MM-DD', true).toDate()}
                    month={moment(`${selectedMonth}-01`, 'YYYY-MM-DD', true).toDate()}
                    captionLayout='dropdown'
                    fromYear={2018}
                    toYear={moment().year() + 2}
                    onMonthChange={(date) => {
                      setSelectedMonth(moment(date).format('YYYY-MM'))
                    }}
                    onSelect={(date) => {
                      if (!date) return
                      setSelectedMonth(moment(date).format('YYYY-MM'))
                      setIsMonthPickerOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {dateFilterMode === 'range' && (
            <>
              <div className='w-full min-w-37.5 sm:w-auto'>
                <label className='mb-1 block text-xs font-medium text-slate-500'>
                  {language === 'th' ? 'จากวันที่' : 'From'}
                </label>
                <Popover
                  open={isStartPickerOpen}
                  onOpenChange={(open) => {
                    setIsStartPickerOpen(open)
                    if (open) {
                      setStartPickerMonth(
                        startDate
                          ? moment(startDate, 'YYYY-MM-DD', true).toDate()
                          : (endDate ? moment(endDate, 'YYYY-MM-DD', true).toDate() : moment().toDate())
                      )
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      className='h-10 w-full justify-between border-slate-300 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    >
                      <span>
                        {startDate
                          ? moment(startDate, 'YYYY-MM-DD', true).locale(language === 'th' ? 'th' : 'en').format('D MMM YYYY')
                          : (language === 'th' ? 'เลือกวันที่เริ่มต้น' : 'Select start date')}
                      </span>
                      <CalendarDays className='h-4 w-4 opacity-70' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={startDate ? moment(startDate, 'YYYY-MM-DD', true).toDate() : undefined}
                      month={startPickerMonth}
                      captionLayout='dropdown'
                      fromYear={2000}
                      toYear={moment().year() + 2}
                      onMonthChange={(date) => setStartPickerMonth(date)}
                      onSelect={(date) => {
                        if (!date) return
                        const next = moment(date).format('YYYY-MM-DD')
                        setStartPickerMonth(date)
                        setStartDate(next)
                        if (endDate && moment(endDate).isBefore(moment(next))) {
                          setEndDate(next)
                        }
                        setIsStartPickerOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className='w-full min-w-37.5 sm:w-auto'>
                <label className='mb-1 block text-xs font-medium text-slate-500'>
                  {language === 'th' ? 'ถึงวันที่' : 'To'}
                </label>
                <Popover
                  open={isEndPickerOpen}
                  onOpenChange={(open) => {
                    setIsEndPickerOpen(open)
                    if (open) {
                      setEndPickerMonth(
                        endDate
                          ? moment(endDate, 'YYYY-MM-DD', true).toDate()
                          : (startDate ? moment(startDate, 'YYYY-MM-DD', true).toDate() : moment().toDate())
                      )
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      className='h-10 w-full justify-between border-slate-300 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    >
                      <span>
                        {endDate
                          ? moment(endDate, 'YYYY-MM-DD', true).locale(language === 'th' ? 'th' : 'en').format('D MMM YYYY')
                          : (language === 'th' ? 'เลือกวันที่สิ้นสุด' : 'Select end date')}
                      </span>
                      <CalendarDays className='h-4 w-4 opacity-70' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={endDate ? moment(endDate, 'YYYY-MM-DD', true).toDate() : undefined}
                      month={endPickerMonth}
                      captionLayout='dropdown'
                      fromYear={2000}
                      toYear={moment().year() + 2}
                      onMonthChange={(date) => setEndPickerMonth(date)}
                      onSelect={(date) => {
                        if (!date) return
                        const next = moment(date).format('YYYY-MM-DD')
                        setEndPickerMonth(date)
                        setEndDate(next)
                        if (startDate && moment(startDate).isAfter(moment(next))) {
                          setStartDate(next)
                        }
                        setIsEndPickerOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>
      </div>

      <CardInfo budgetList={filteredBudgetList} isLoading={isBudgetLoading}/>
       <div className='mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3'>
          <div className='xl:col-span-2'>
            <BarChartDashboard
              budgetList={filteredBudgetList}
            />

          
          <ExpensesListTable
            expensesList={filteredExpenses}
            gridHeight='clamp(420px, calc(100vh - 260px), 820px)'
            refreshData={getAllExpenses}
          />  

          </div>
          <div className='flex flex-col gap-5 self-start'>
            <h2 className='text-lg font-bold'>{t('dashboard.latestBudgets')}</h2>
            {filteredBudgetList.slice(0, 4).map((budget,index) => (
               <BudgetItem key={index} budget={budget}/>
            ))}
          </div>
       </div>
    </section>
  )
}

export default Dashboard