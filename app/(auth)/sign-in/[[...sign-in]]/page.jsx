import { SignUp } from '@clerk/nextjs'
import Image from 'next/image'

export default function Page() {
  return <div className="bg-white dark:bg-gray-900">
        <div className="flex justify-center h-screen">
          <div
            className="hidden bg-cover lg:block lg:w-2/3"
          >
            <div className="h-full w-full bg-amber-900 bg-opacity-40">
              <Image 
                  src='/bg-test.png' 
                  alt='bg' 
                  width={1000} 
                  height={1000}
                  className='w-full h-full object-cover' 
                 
                  />
              {/* <div>
                <h2 className="text-4xl font-bold text-white">Brand</h2>
                <p className="max-w-xl mt-3 text-gray-300">
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit. In
                  autem ipsa, nulla laboriosam dolores, repellendus perferendis
                  libero suscipit nam temporibus molestiae
                </p>
              </div> */}
            </div>
          </div>
  
          <div className="flex items-center w-full max-w-md px-6 mx-auto lg:w-2/6">
            <div className="flex-1">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-center text-gray-700 dark:text-white">
                  Welcome, to <span className="text-amber-600">Exfinit</span>
                </h2>
                <p className="mt-3 text-gray-500 dark:text-gray-300">
                  Sign Up to access your account
                </p>
              </div>
  
              <div className="mt-8">
                <SignUp />
  
                {/* <p className="mt-6 text-sm text-center text-gray-400">
                  Don&#x27;t have an account yet?{' '}
                  <a
                    href="#"
                    className="text-blue-500 focus:outline-none focus:underline hover:underline cursor-pointer"
                  >
                    Sign up
                  </a>
                  .
                </p> */}
              </div>
            </div>
          </div>
        </div>
      </div>
}