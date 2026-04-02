"use client"

import React, { createContext, useContext } from 'react'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const language = 'en'
  const mounted = true
  const setLanguage = () => {}
  const toggleLanguage = () => {}

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, mounted }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
