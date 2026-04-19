"use client"
/**
 * expenses/page.jsx — All Expenses List Page (/dashboard/expenses)
 *
 * Displays every expense across ALL budgets for the current user.
 * Features:
 *   - Date filter toolbar (month / range / all) synced with useDashboardDateFilter
 *   - StatCard row: total expenses count, total spend, date range label
 *   - ExpensesListTable: ag-Grid table with inline edit, delete, CSV export
 *
 * Data flow:
 *   - getAllExpensesAction(email) fetches all rows once on load
 *   - filteredExpenses is derived with useMemo from the active date filter
 *   - Density preference is read from useDashboardDensity (shared with budgets page)
 */
import React, { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getAllExpensesAction } from '@/app/_actions/dbActions'
import ExpensesListTable from '../budgets/_components/ExpensesListTable'
import StatCard from '../_components/StatCard'
import { useDashboardDensity } from '@/lib/useDashboardDensity'
import { useDashboardDateFilter } from '@/lib/useDashboardDateFilter'
import { t } from '@/lib/text'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarDays } from 'lucide-react'
import moment from 'moment'

function ExpensesPage() {
  const { user, isLoaded } = useUser();
  const language = 'en';const [expensesList, setExpensesList] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
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
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
  const [startPickerMonth, setStartPickerMonth] = useState(() => moment().toDate());
  const [endPickerMonth, setEndPickerMonth] = useState(() => moment().toDate());
  const [density, setDensity, resolvedDensity] = useDashboardDensity('dashboard-density', 'comfortable');

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

  const getFilteredExpenses = () => {
    if (dateFilterMode === 'all') return expensesList

    if (dateFilterMode === 'month') {
      return expensesList.filter((e) => {
        const m = parseDate(e.createdAt)
        return m && m.format('YYYY-MM') === selectedMonth
      })
    }

    if (dateFilterMode === 'range') {
      const from = startDate ? moment(startDate, 'YYYY-MM-DD', true).startOf('day') : null
      const to = endDate ? moment(endDate, 'YYYY-MM-DD', true).endOf('day') : null
      return expensesList.filter((e) => {
        const m = parseDate(e.createdAt)
        if (!m) return false
        if (from && m.isBefore(from)) return false
        if (to && m.isAfter(to)) return false
        return true
      })
    }

    return expensesList
  }

  const filteredExpenses = useMemo(getFilteredExpenses, [expensesList, dateFilterMode, selectedMonth, startDate, endDate])

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

  const summary = useMemo(() => {
    let periodDays = 1
    if (dateFilterMode === 'month') {
      const selected = moment(selectedMonth, 'YYYY-MM', true)
      const nowKey = moment().format('YYYY-MM')
      periodDays = selectedMonth === nowKey ? moment().date() : selected.daysInMonth()
    } else if (dateFilterMode === 'range') {
      const from = startDate ? moment(startDate, 'YYYY-MM-DD', true).startOf('day') : null
      const to = endDate ? moment(endDate, 'YYYY-MM-DD', true).endOf('day') : null
      if (from && to) {
        periodDays = Math.max(to.diff(from, 'days') + 1, 1)
      } else {
        const validDates = filteredExpenses
          .map((e) => parseDate(e.createdAt))
          .filter(Boolean)
          .sort((a, b) => a.valueOf() - b.valueOf())
        if (validDates.length > 1) {
          periodDays = Math.max(validDates[validDates.length - 1].diff(validDates[0], 'days') + 1, 1)
        }
      }
    } else {
      const uniqueDays = new Set(
        filteredExpenses
          .map((e) => parseDate(e.createdAt))
          .filter(Boolean)
          .map((m) => m.format('YYYY-MM-DD'))
      )
      periodDays = Math.max(uniqueDays.size, 1)
    }

    const periodTotal = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const overallTotal = expensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const avgPerDay = periodDays > 0 ? periodTotal / periodDays : 0

    const categoryTotals = {}
    filteredExpenses.forEach(e => {
      if (e.category) categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount || 0)
    })
    const topEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
    const topCategory = topEntry ? topEntry[0] : '—'
    const topCategoryAmount = topEntry ? topEntry[1] : 0

    return {
      periodTotal,
      totalAmount: overallTotal,
      avgPerDay,
      topCategory,
      topCategoryAmount,
      periodDays,
      periodLabel,
    }
  }, [filteredExpenses, expensesList, dateFilterMode, selectedMonth, startDate, endDate, periodLabel]);

  useEffect(() => {
    if (isLoaded && user) {
      getAllExpenses();
    }
  }, [isLoaded, user]);

  const getAllExpenses = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    setIsFetching(true);
    try {
      const result = await getAllExpensesAction(email);
      setExpensesList(result || []);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <section className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
      <div className='rounded-2xl border bg-linear-to-br from-white to-slate-50 px-4 py-4 shadow-sm sm:px-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-amber-600'>{t('expensesPage.title')}</p>
        <h1 className='mt-1 text-2xl font-bold tracking-tight sm:text-3xl'>{t('expensesPage.heading')}</h1>
        <p className='mt-1 text-sm text-slate-500'>{t('expensesPage.subtitle')}</p>
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

      <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          loading={!isLoaded || isFetching}
          title={dateFilterMode === 'month' ? t('expensesStats.thisMonth') : (language === 'th' ? 'ยอดตามช่วงเวลา' : 'Period Total')}
          value={`฿${summary.periodTotal.toLocaleString('th-TH')}`}
          caption={summary.periodLabel}
          formula={t('expensesStats.thisMonthFormula')}
          tone='amber'
          points={filteredExpenses.slice(-10).map(e => Number(e.amount || 0))}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title={t('expensesStats.totalAmount')}
          value={`฿${summary.totalAmount.toLocaleString('th-TH')}`}
          caption={`${expensesList.length} ${t('expensesStats.allRecords')}`}
          formula={t('expensesStats.totalAmountFormula')}
          tone='slate'
          points={filteredExpenses.slice(-10).map(e => Number(e.amount || 0))}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title={t('expensesStats.avgPerDay')}
          value={`฿${summary.avgPerDay.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
          caption={`${summary.periodDays} ${language === 'th' ? 'วันในช่วงที่เลือก' : 'days in selected period'}`}
          formula={t('expensesStats.avgPerDayFormula')}
          tone='emerald'
          points={Array.from({ length: summary.periodDays }, (_, i) => i + 1).slice(-10).map(d => summary.periodTotal / d)}
        />
        <StatCard
          loading={!isLoaded || isFetching}
          title={t('expensesStats.topCategory')}
          value={summary.topCategory}
          caption={summary.topCategoryAmount > 0 ? `฿${summary.topCategoryAmount.toLocaleString('th-TH')}` : '—'}
          formula={t('expensesStats.topCategoryFormula')}
          tone='white'
          points={filteredExpenses.slice(-10).map(e => Number(e.amount || 0))}
        />
      </div>

      <ExpensesListTable
        expensesList={filteredExpenses}
        refreshData={getAllExpenses}
        density={resolvedDensity}
        densityMode={density}
        onDensityChange={setDensity}
        showDensityToggle
        gridHeight='clamp(420px, calc(100vh - 270px), 820px)'
      />
    </section>
  )
}

export default ExpensesPage
