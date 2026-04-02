"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "w-full space-y-4",
        month_caption: "relative flex h-7 items-center justify-center px-8",
        caption_label: "select-none text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 border-slate-300 bg-transparent p-0 text-slate-700 opacity-80 hover:opacity-100 dark:border-slate-700 dark:text-slate-200"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 border-slate-300 bg-transparent p-0 text-slate-700 opacity-80 hover:opacity-100 dark:border-slate-700 dark:text-slate-200"
        ),
        dropdowns: "flex h-8 items-center gap-2",
        dropdown_root: "relative inline-flex min-w-20 items-center rounded-md border border-slate-300 bg-white px-2 text-slate-800 shadow-xs has-focus:border-ring has-focus:ring-2 has-focus:ring-ring/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
        dropdown: "rdp-dropdown h-7 min-w-16 cursor-pointer appearance-none bg-transparent px-1 text-sm font-medium text-inherit outline-none",
        months_dropdown: "text-sm font-medium",
        years_dropdown: "text-sm font-medium",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground w-9 rounded-md text-[0.8rem] font-normal",
        week: "mt-2 flex w-full",
        day: "relative h-9 w-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        selected: "bg-amber-600 text-white hover:bg-amber-600 hover:text-white focus:bg-amber-600 focus:text-white",
        today: "bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        range_middle: "bg-accent text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...iconProps }) =>
          orientation === "left"
            ? <ChevronLeft className={cn("h-4 w-4", chevronClassName)} {...iconProps} />
            : <ChevronRight className={cn("h-4 w-4", chevronClassName)} {...iconProps} />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
