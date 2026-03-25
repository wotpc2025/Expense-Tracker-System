import React from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  totalSpend: {
    label: 'Spend',
    color: 'var(--chart-1)',
  },
  amount: {
    label: 'Budget',
    color: 'var(--chart-2)',
  },
}

function BarChartDashboard({budgetList}) {
  const hasData = Array.isArray(budgetList) && budgetList.length > 0

  return (
    <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-800'>
        <div className='mb-3'>
          <h2 className='text-lg font-bold sm:text-xl'>Budget vs Spend</h2>
          <p className='text-xs text-slate-500'>Monthly activity overview</p>
        </div>

        <ChartContainer config={chartConfig} className='h-80 w-full'>
          {hasData ? (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                accessibilityLayer
                data={budgetList}
                margin={{
                  top: 8,
                  right: 10,
                  left: -10,
                  bottom: 0,
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray='3 3' className='stroke-slate-200' />
                <XAxis
                  dataKey='name'
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => String(value).slice(0, 8)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `฿${Number(value).toLocaleString('th-TH')}`}
                />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => `฿${Number(value || 0).toLocaleString('th-TH')}`} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey='amount' fill='var(--color-amount)' radius={[6, 6, 0, 0]} />
                <Bar dataKey='totalSpend' fill='var(--color-totalSpend)' radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500'>
              No budget data to display yet.
            </div>
          )}
        </ChartContainer>
    </div>
  )
}

export default BarChartDashboard