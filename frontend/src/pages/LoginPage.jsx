import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Navbar from '../components/Navbar/Navbar';
import { AuthContext } from '../context/AuthContext';

export default function LoginPage () {
  const { t } = useTranslation();
  const [username, setUsername] = useState(null);
  const [password, setPassword] = useState(null);

  const { login } = useContext(AuthContext);

  const handleSubmit = async () => {
    await login(username, password);
  };

  return (
    <div>
      <Navbar />
      <section className='bg-gray-50 dark:bg-gray-900'>
        <div className='flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0'>
          <span className='flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white' />
          <div className='w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700'>
            <div className='p-6 space-y-4 md:space-y-6 sm:p-8'>
              <h1 className='text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white text-center'>
                {t('sign_in_to_your_account')}
              </h1>
              <div className='space-y-4 md:space-y-6'>
                <div>
                  <span
                    className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                  >
                    {t('username')}
                  </span>
                  <input
                    type='text'
                    name='username'
                    id='email'
                    className='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                    placeholder='admin'
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <span
                    className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                  >
                    {t('password')}
                  </span>
                  <input
                    type='password'
                    name='password'
                    id='password'
                    placeholder='••••••••'
                    className='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {/* <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="remember"
                        aria-describedby="remember"
                        type="checkbox"
                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                        required=""
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <span
                        for="remember"
                        className="text-gray-500 dark:text-gray-300"
                      >
                        Remember me
                      </span>
                    </div>
                  </div>
                  <a
                    href="#"
                    className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
                  >
                    Forgot password?
                  </a>
                </div> */}
                <button
                  onClick={handleSubmit}
                  type='submit'
                  className='w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800'
                >
                  {t('sign_in')}
                </button>
                {/* <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                  Don’t have an account yet?{" "}
                  <a
                    href="#"
                    className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                  >
                    Sign up
                  </a>
                </p> */}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
