"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getAllExpensesAction, getBudgetListAction } from '@/app/_actions/dbActions'
import BudgetItem from './BudgetItem'
import CreateBudget from './CreateBudget'
import { CalendarDays, LayoutGrid, List, MonitorCog, PiggyBank, RotateCcw, ScanLine } from 'lucide-react'
import StatCard from '../../_components/StatCard'
import { useDashboardDensity } from '@/lib/useDashboardDensity'
import { getTranslation } from '@/lib/translations'
import { useDashboardDateFilter } from '@/lib/useDashboardDateFilter'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import moment from 'moment'

function BudgetList() {
  const [budgetList, setBudgetList] = useState([])
  const [expensesList, setExpensesList] = useState([])
  const [isFetching, setIsFetching] = useState(false)
  const [density, setDensity, resolvedDensity, resetDensity] = useDashboardDensity('dashboard-density', 'comfortable')
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
  const { user, isLoaded } = useUser();
  const language = 'en';const currencyLocale = language === 'th' ? 'th-TH' : 'en-US'

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

  const getBudgetList = React.useCallback(async () => {
    const email = user?.primaryEmailAddress?.emailAddress
    if (!email) {
      console.warn('Email not available')
      return
    }
    setIsFetching(true)
    try {
      const [budgetResult, expenseResult] = await Promise.all([
        getBudgetListAction(email),
        getAllExpensesAction(email),
      ])

      const result = budgetResult
      if (result && result.length > 0) {
        setBudgetList(result)
      } else {
        setBudgetList([])
      }

      setExpensesList(expenseResult || [])
    } finally {
      setIsFetching(false)
    }
  }, [user])

  React.useEffect(() => {
    if (isLoaded && user) {
      getBudgetList()
    }
  }, [isLoaded, user, getBudgetList])

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

  const summary = useMemo(() => {
    const totalBudget = filteredBudgetList.reduce((sum, budget) => sum + Number(budget?.amount || 0), 0)
    const totalSpend = filteredBudgetList.reduce((sum, budget) => sum + Number(budget?.totalSpend || 0), 0)
    const activeBudgets = filteredBudgetList.length
    return {
      totalBudget,
      totalSpend,
      remaining: totalBudget - totalSpend,
      activeBudgets,
    }
  }, [filteredBudgetList])

  return (
    <div className='mt-5 sm:mt-6'>
      <div className='mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:mb-5'>
        <div className='mb-3 text-xs font-medium text-slate-500'>
          {language === 'th' ? 'ช่วงเวลาที่แสดง: ' : 'Current period: '}{periodLabel}
        </div>
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

      {/* Summary cards + sparklines */}
      <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:mb-5'>
        <StatCard
          loading={!isLoaded || isFetching}
          title={getTranslation(language, 'budgetStats.totalBudget')}
          value={`฿${summary.totalBudget.toLocaleString(currencyLocale)}`}
          caption={getTranslation(language, 'budgetStats.budgetCapacity')}
          formula={getTranslation(language, 'budgetStats.totalBudgetFormula')}
          tone='amber'
          points={filteredBudgetList.slice(-6).map((item) => Number(item?.amount || 0))}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title={getTranslation(language, 'budgetStats.totalSpend')}
          value={`฿${summary.totalSpend.toLocaleString(currencyLocale)}`}
          caption={getTranslation(language, 'budgetStats.moneyUsed')}
          formula={getTranslation(language, 'budgetStats.totalSpendFormula')}
          tone='slate'
          points={filteredBudgetList.slice(-6).map((item) => Number(item?.totalSpend || 0))}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title={getTranslation(language, 'budgetStats.remaining')}
          value={`฿${Math.max(summary.remaining, 0).toLocaleString(currencyLocale)}`}
          caption={getTranslation(language, 'budgetStats.availableNow')}
          formula={getTranslation(language, 'budgetStats.remainingFormula')}
          tone='emerald'
          points={filteredBudgetList.slice(-6).map((item) => Math.max(Number(item?.amount || 0) - Number(item?.totalSpend || 0), 0))}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title={getTranslation(language, 'budgetStats.activeBudgets')}
          value={summary.activeBudgets}
          caption={getTranslation(language, 'budgetStats.currentPlans')}
          formula={getTranslation(language, 'budgetStats.activeBudgetsFormula')}
          tone='white'
          points={filteredBudgetList.slice(-6).map((item, index) => index + 1)}
        />
      </div>

      <div className='mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-5'>
        <CreateBudget
          refreshData={getBudgetList}
          trigger={
            <button className='inline-flex h-10 items-center overflow-hidden rounded-xl border border-amber-400 shadow-sm cursor-pointer group transition-all hover:shadow-md dark:border-amber-600'>
              <span className='flex items-center gap-2 bg-amber-500 px-4 h-full text-white text-sm font-semibold group-hover:bg-amber-600 transition-colors'>
                <PiggyBank className='h-4 w-4 shrink-0' />
                {getTranslation(language, 'budgets.createNew')}
              </span>
              <span className='w-px self-stretch bg-amber-300 dark:bg-amber-600' />
              <span className='flex items-center gap-2 px-4 h-full text-amber-700 dark:text-amber-300 text-sm font-medium bg-amber-50 dark:bg-amber-950/40 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors'>
                <ScanLine className='h-4 w-4 shrink-0' />
                {getTranslation(language, 'createBudget.scanReceipt')}
              </span>
            </button>
          }
        />

        <div className='inline-flex h-10 items-center rounded-md border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900'>
          <button
            type='button'
            onClick={() => setDensity('compact')}
            className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              density === 'compact' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <List className='h-3.5 w-3.5' />
            {getTranslation(language, 'density.compact')}
          </button>
          <button
            type='button'
            onClick={() => setDensity('comfortable')}
            className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              density === 'comfortable' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <LayoutGrid className='h-3.5 w-3.5' />
            {getTranslation(language, 'density.comfort')}
          </button>
          <button
            type='button'
            onClick={() => setDensity('auto')}
            className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              density === 'auto' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            title={`Auto mode is currently ${resolvedDensity}`}
          >
            <MonitorCog className='h-3.5 w-3.5' />
            {getTranslation(language, 'density.auto')}
          </button>
          <button
            type='button'
            onClick={resetDensity}
            className='inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer dark:text-slate-300 dark:hover:bg-slate-700'
            title={getTranslation(language, 'expensesTable.resetDensity')}
          >
            <RotateCcw className='h-3.5 w-3.5' />
            {getTranslation(language, 'expensesTable.reset')}
          </button>
        </div>
      </div>
      <div className={`grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 ${resolvedDensity === 'compact' ? 'gap-3 sm:gap-4' : 'gap-4 sm:gap-5'}`}>
        {isFetching
          ? [1,2,3,4,5].map((item,index) => (
              <div key={index} className={`w-full animate-pulse rounded-xl bg-slate-200 ${resolvedDensity === 'compact' ? 'h-34' : 'h-40'}`}></div>
            ))
          : filteredBudgetList?.length > 0
            ? filteredBudgetList.map((budget, index) => (
                <BudgetItem budget={budget} density={resolvedDensity} key={index} />
              ))
            : (
                <div className='col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400'>
                  {language === 'th' ? 'ไม่พบข้อมูลงบประมาณในช่วงเวลาที่เลือก' : 'No budget data found for the selected period'}
                </div>
              )
        }
      </div>
    </div>
  )
}

export default BudgetList