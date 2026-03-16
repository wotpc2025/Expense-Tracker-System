import React from 'react'
import { Bar, BarChart, Legend, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts'

function BarChartDashboard({budgetList}) {
  return (
    <div className='border rounded-lg p-5'>
        <h2 className='font-bold text-lg'>Activity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
          data={budgetList}
          margin={{
              top: 10,
              right: 50,
              left: 0,
              bottom: 0
          }}
          >
              <XAxis dataKey='name'/>
              <YAxis/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey='totalSpend' stackId="a" fill='#e17100'/>
              <Bar dataKey='amount' stackId="a" fill='#f9e3cc'/>
          </BarChart>
        </ResponsiveContainer>
    </div>
  )
}

export default BarChartDashboard