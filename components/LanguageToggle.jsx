"use client"

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/app/(routes)/dashboard/_providers/LanguageProvider'
import { Globe } from 'lucide-react'

export function LanguageToggle() {
  const { language, toggleLanguage, mounted } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  // Guard against hydration mismatch
  if (!mounted) {
    return (
      <button disabled className='p-2 rounded-lg cursor-not-allowed opacity-50'>
        <Globe className='h-4 w-4' />
      </button>
    )
  }

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`Current language: ${language === 'en' ? 'English' : 'ไทย'}`}
        className='p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors'
      >
        <Globe className='h-4 w-4 text-slate-600 dark:text-slate-300' />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className='fixed inset-0 z-30'
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className='absolute bottom-full right-0 mb-2 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-40 overflow-hidden'>
            <button
              onClick={() => {
                if (language !== 'en') toggleLanguage()
                setIsOpen(false)
              }}
              className={`cursor-pointer w-full text-left px-4 py-2 text-sm transition-colors ${
                language === 'en'
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              English
            </button>
            <button
              onClick={() => {
                if (language !== 'th') toggleLanguage()
                setIsOpen(false)
              }}
              className={`cursor-pointer w-full text-left px-4 py-2 text-sm transition-colors border-t border-slate-200 dark:border-slate-700 ${
                language === 'th'
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              ไทย
            </button>
          </div>
        </>
      )}
    </div>
  )
}
