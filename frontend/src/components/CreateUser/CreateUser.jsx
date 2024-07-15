import React, { useState } from 'react';
import instance from '../../api/AxiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toastMessage } from '../../utils/Toast';
import { Icon } from '@iconify/react';

export default function CreateUser () {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    rePassword: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      toastMessage('Password must be 8 characters', 'warning');
      return;
    }

    if (formData.password !== formData.rePassword) {
      toastMessage('Password and Confirm Password do not match', 'warning');
      return;
    }

    try {
      const response = await instance.post('/auth/user/create', {
        username: formData.username,
        password: formData.password,
        email: formData.email
      });
      if (response?.status === 200) {
        toastMessage('User Created Successfully', 'success');
        navigate('/dashboard/admin/user-list');
      }
    } catch (err) {
      if (!err.response) {
        toastMessage(err?.message, 'error');
        navigate('/server-down');
      }
      toastMessage(err?.response?.data?.message, 'error');
    }
  };

  return (
    <AnimatePresence>

      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='flex pb-10'
        aria-label='Breadcrumb'
      >
        <ol className='inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse'>
          <li className='inline-flex items-center '>
            <Link
              to='/dashboard/admin/user-list'
            >

              <span
                className='inline-flex items-center gap-1 text-md font-medium text-black hover:text-blue-600 dark:hover:text-blue-600 dark:text-white '
              >
                <Icon icon='material-symbols:home' className=' ' />
                user management
              </span>
            </Link>
          </li>
          <li aria-current='page'>
            <div className='flex items-center'>
              <Icon icon='mingcute:right-fill' className='w-5 h-5 text-gray-500' />
              <span className='ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400'>
                Add User
              </span>
            </div>
          </li>
        </ol>
      </motion.nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='mx-auto max-w-screen-xl justify-start pr-4 lg:pr-12 '
      >
        <div className='flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4'>
          <div className='w-full md:w-full'>
            <form onSubmit={handleSubmit}>
              <div className='overflow-x-auto'>
                <div className='relative justify-start w-full max-w-2xl h-full md:h-auto'>
                  <div className='relative bg-white rounded-lg shadow dark:bg-gray-800 sm:p-2'>
                    <div className='flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600'>
                      <h3 className='text-lg text-center font-semibold text-gray-900 dark:text-white'>
                        Add user
                      </h3>
                      <Link
                        to='/dashboard/admin/user-list'
                        className='flex items-center gap-2 justify-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800'
                      >
                        Back
                        <Icon icon='pajamas:go-back' width='1.2rem' height='1.2rem' />
                      </Link>
                    </div>

                    <div className='grid gap-4 mb-4 '>
                      <div>
                        <label
                          htmlFor='username'
                          className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                        >
                          Username
                        </label>
                        <input
                          type='text'
                          name='username'
                          id='username'
                          value={formData.username}
                          onChange={handleChange}
                          className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                          placeholder='Enter username'
                          required
                          autoComplete='username'
                        />
                      </div>

                      <div>
                        <label
                          htmlFor='email'
                          className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                        >
                          Email
                        </label>
                        <input
                          type='email'
                          name='email'
                          id='email'
                          value={formData.email}
                          onChange={handleChange}
                          className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                          placeholder='Enter email'
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor='password'
                          className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                        >
                          Password
                        </label>
                        <input
                          type='password'
                          name='password'
                          id='password'
                          value={formData.password}
                          onChange={handleChange}
                          className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                          placeholder='Enter password'
                          required
                          autoComplete='new-password'
                        />
                      </div>

                      <div>
                        <label
                          htmlFor='re-password'
                          className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                        >
                          Confirm Password
                        </label>
                        <input
                          type='password'
                          name='rePassword'
                          id='re-password'
                          value={formData.rePassword}
                          onChange={handleChange}
                          className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                          placeholder='Re-enter password'
                          required
                          autoComplete='new-password'
                        />
                      </div>
                    </div>
                    <div className='flex justify-center my-5'>
                      <button
                        type='submit'
                        className='flex text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800'
                      >
                        New user
                        <Icon icon='ei:plus' className='w-6 h-6 dark:text-white' />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}
