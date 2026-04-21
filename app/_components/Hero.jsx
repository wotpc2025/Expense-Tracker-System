"use client"
/**
 * Hero.jsx — Landing Page Hero Section
 *
 * Full-width marketing block shown below the Header on the public landing page.
 * Contains:
 *   - Bold headline (2 lines, amber accent) via getTranslation()
 *   - Subtitle paragraph
 *   - "Get Started" CTA button linking to /sign-up
 *   - Dashboard preview screenshot image
 *
 * This is a pure presentational component: no state, no data fetching.
 * Language is hardcoded to 'en' — change to a prop to support switching.
 */
import Image from 'next/image'
import Link from 'next/link'
import { getTranslation } from '@/lib/translations'

function Hero() {
    const language = 'en';
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
          <Image src='/dashboard black.png' alt='dashboard'
          width={1000} 
          height={1000}
          className='mt-5 rounded-xl border-2'
          />
      </section>
  )
}

export default Hero