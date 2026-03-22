"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Legend, Tooltip } from "recharts"

const ChartContext = React.createContext(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used inside a ChartContainer")
  }
  return context
}

function ChartContainer({ id, className, children, config = {} }) {
  const chartId = React.useId()
  const containerId = id || `chart-${chartId.replace(/:/g, "")}`

  const style = React.useMemo(() => {
    const variables = {}

    Object.entries(config).forEach(([key, item]) => {
      if (item?.color) {
        variables[`--color-${key}`] = item.color
      }
    })

    return variables
  }, [config])

  return (
    <ChartContext.Provider value={{ config }}>
      <div data-slot="chart" data-chart={containerId} style={style} className={cn("w-full", className)}>
        {children}
      </div>
    </ChartContext.Provider>
  )
}

function ChartTooltip(props) {
  return <Tooltip {...props} />
}

function ChartTooltipContent({ active, payload, label, formatter, hideLabel = false }) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      {!hideLabel && <div className="mb-2 font-semibold text-slate-700">{label}</div>}
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const key = entry.dataKey
          const itemConfig = config[key] || {}
          const displayName = itemConfig.label || entry.name || key
          const color = entry.color || itemConfig.color || "#64748b"

          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <span>{displayName}</span>
              </div>
              <span className="font-semibold text-slate-800">
                {formatter ? formatter(entry.value, key, entry) : Number(entry.value || 0).toLocaleString("th-TH")}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartLegend(props) {
  return <Legend {...props} />
}

function ChartLegendContent({ payload }) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
      {payload.map((entry) => {
        const key = entry.dataKey
        const itemConfig = config[key] || {}
        const color = entry.color || itemConfig.color || "#64748b"

        return (
          <div key={key} className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span>{itemConfig.label || entry.value || key}</span>
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
}
