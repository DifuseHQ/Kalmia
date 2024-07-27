import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

import { createUser } from '../../api/Requests';
import { handleError } from '../../utils/Common';
import { toastMessage } from '../../utils/Toast';
import Breadcrumb from '../Breadcrumb/Breadcrumb';

export default function CreateUser () {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toastMessage('Password must be at least 8 characters', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      toastMessage('Password and Confirm Password do not match', 'warning');
      return;
    }

    const userData = {
      username,
      password,
      email
    };

    const result = await createUser(userData);

    if (result.status === 'success') {
      toastMessage('User Created Successfully', 'success');
      navigate('/dashboard/admin/user-list');
    } else {
      handleError(result, navigate);
    }
  };

  return (
    <div className='w-full mx-auto'>
      <Breadcrumb />
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-white mb-6'>
          Create New User
        </h2>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Username
            </span>
            <input
              type='text'
              id='username'
              ref={inputRef}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className='w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              required
            />
          </div>

          <div>
            <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Email Address
            </span>
            <input
              type='email'
              id='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              required
            />
          </div>

          <div>
            <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Password
            </span>
            <input
              type='password'
              id='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              required
            />
          </div>

          <div>
            <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Confirm Password
            </span>
            <input
              type='password'
              id='confirmPassword'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className='w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              required
            />
          </div>

          <div className='flex justify-start space-x-4'>
            <button
              type='submit'
              className='bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition duration-300 flex items-center'
            >
              <span className='mr-2'>Create User</span>
              <Icon icon='ei:plus' className='w-5 h-5' />
            </button>
            <button
              type='button'
              onClick={() => navigate('/dashboard/admin/user-list')}
              className='bg-gray-500 text-white rounded-md px-4 py-2 hover:bg-gray-600 transition duration-300'
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
