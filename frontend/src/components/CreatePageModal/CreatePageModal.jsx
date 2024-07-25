import React, { useContext, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';

import { ModalContext } from '../../context/ModalContext';

export default function CreatePage ({ handleCreate }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCreate(title, slug);
    }
  };

  const { closeModal } = useContext(ModalContext);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50'
        key='create-page-1'
      >
        <div className='relative p-4 w-full max-w-xl'>
          <div className='relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5'>
            <div className='flex justify-between items-center mb-4 sm:mb-5 dark:border-gray-600'>
              <div className='flex-grow text-center'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  New Page
                </h3>
              </div>
              <button
                onClick={() => closeModal('createPage')}
                type='button'
                className='text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white'
              >
                <Icon icon='material-symbols:close' className='w-6 h-6' />
                <span className='sr-only'>Close modal</span>
              </button>
            </div>
            <div className='grid gap-4 mb-4'>
              <div>
                <label
                  htmlFor='title'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Title
                </label>
                <input
                  ref={inputRef}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  type='text'
                  name='title'
                  id='title'
                  className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                  placeholder='Enter page title'
                  required
                />
              </div>
              <div>
                <label
                  htmlFor='slug'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Slug
                </label>
                <input
                  onChange={(e) => setSlug(e.target.value)}
                  onKeyDown={handleKeyDown}
                  type='text'
                  name='slug'
                  id='slug'
                  className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                  placeholder='Enter page slug'
                  required
                />
              </div>
              <button
                onClick={() => handleCreate(title, slug)}
                type='button'
                className='flex justify-center items-center gap-1 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 w-full dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'
              >
                <span>Create Page</span>
                <Icon icon='ei:plus' className='w-6 h-6' />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
