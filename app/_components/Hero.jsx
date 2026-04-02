"use client"

import Image from 'next/image'
import React from 'react'
import Link from 'next/link'
import { useLanguage } from '@/app/(routes)/dashboard/_providers/LanguageProvider'
import { getTranslation } from '@/lib/translations'

function Hero() {
    const { language } = useLanguage()

  return (
      <section className="bg-gray-50 dark:bg-gray-900 flex items-center flex-col">
          <div className="mx-auto w-screen max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
              <div className="mx-auto max-w-prose text-center">
                  <h1 className="text-4xl font-extrabold  sm:text-5xl dark:text-white whitespace-nowrap">
                                            {getTranslation(language, 'landing.heroTitleLine1')}
                        <br></br>
                      <strong className="text-amber-600 font-extrabold whitespace-nowrap"> 
                                                {getTranslation(language, 'landing.heroTitleLine2')}
                        </strong>
                     
                  </h1>

                  <p className="mt-4 sm:text-xl/relaxed font-bold text-black">
                      {getTranslation(language, 'landing.heroSubtitle')}
                  </p>

                  <div className="mt-8 flex flex-wrap justify-center gap-4">
                      <Link className="inline-block rounded bg-amber-600 px-12 py-3 
                      text-sm font-medium text-white shadow transition-colors hover:bg-amber-700" 
                      href="/sign-up">
                          {getTranslation(language, 'landing.getStarted')}
                      </Link>
                  </div>
              </div>
          </div>
          <Image src='/dashboard.png' alt='dashboard'
          width={1000} 
          height={1000}
          className='mt-5 rounded-xl border-2'
          />
      </section>
  )
}

export default Hero