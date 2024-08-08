import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react/dist/iconify.js';

import { baseURL } from '../api/AxiosInstance';
import Navbar from '../components/Navbar/Navbar';
import { AuthContext } from '../context/AuthContext';

export default function LoginPage () {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginOAuth } = useContext(AuthContext);

  if (window.location.pathname.startsWith('/admin/login/gh') || 
        window.location.pathname.startsWith('/admin/login/ms') ||
        window.location.pathname.startsWith('/admin/login/gg')) {
    const code = new URLSearchParams(window.location.search).get('token');
    if (code) {
      loginOAuth(code);
    }
  }

  useEffect(() => {
    document.title = 'Kalmia - Login';
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleLogin = (provider) => {
    return () => {
      switch (provider) {
        case 'github':
          window.location.href = `${baseURL}/oauth/github`;
          break;
        case 'google':
          window.location.href = `${baseURL}/oauth/google`;
          break;
        case 'microsoft':
          window.location.href = `${baseURL}/oauth/microsoft`;
          break;
        default:
          break;
      }
    };
  };

  return (
    <div>
      <Navbar />
      <section className="bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto h-screen lg:py-0">
          <span className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white" />
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white text-center">
                {t('sign_in_to_your_account')}
              </h1>
              <div className="space-y-4 md:space-y-6">
                <div>
                  <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    {t('username')}
                  </span>
                  <input
                    type="text"
                    name="username"
                    id="email"
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="admin"
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    {t('password')}
                  </span>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                <div className="grid gap-4 grid-cols-3">
                  <button
                    onClick={handleLogin('github')}
                    className="w-full inline-flex items-center justify-center py-2.5 px-5 focus:ring-2 dark:focus:ring-2 focus:outline-none focus:ring-gray-700 dark:focus:ring-gray-700 font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                  >
                    <Icon icon="mdi:github" className="w-6 h-6" />
                  </button>

                  <button onClick={handleLogin('google')} className="w-full inline-flex items-center justify-center py-2.5 px-5 focus:ring-2 dark:focus:ring-2 focus:outline-none focus:ring-gray-700 dark:focus:ring-gray-700 font-medium text-gray-900  bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                    <Icon icon="mdi:google" className="w-6 h-6" />
                  </button>

                  <button onClick={handleLogin('microsoft')} className="w-full inline-flex items-center justify-center py-2.5 px-5 focus:ring-2 dark:focus:ring-2 focus:outline-none focus:ring-gray-700 dark:focus:ring-gray-700 font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                    <Icon icon="mdi:microsoft" className="w-6 h-6" />
                  </button>
                </div>

                <button
                  onClick={handleSubmit}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    t('sign_in')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
