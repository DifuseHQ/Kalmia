import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';

export default function DeleteModal ({
  title,
  cancelModal,
  deleteDoc,
  message
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50'
      >
        <div className='relative p-4 w-full max-w-xl'>
          <div className='relative p-4 text-center bg-gray-200 rounded-lg shadow dark:bg-gray-800 sm:p-5'>
            <button
              onClick={() => cancelModal()}
              type='button'
              className='text-gray-400 absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white'
            >
              <Icon icon='material-symbols:close' className='w-6 h-6' />
              <span className='sr-only'>Close modal</span>
            </button>
            {title && (
              <h3 className='mb-2 mt-5 text-2xl font-bold text-gray-900 dark:text-white'>
                {title}
              </h3>
            )}
            {message && (
              <div
                className=' p-4 mb-4 text-sm text-left text-yellow-600 bg-orange-100 rounded-lg sm:mb-5 dark:bg-gray-700 dark:text-yellow-400'
                role='alert'
              >
                <div className='flex items-center mb-1'>
                  <Icon icon='ph:warning-fill' className='' />

                  <span className='font-semibold leading-none'>Warning</span>
                </div>

                <p>{message}</p>
              </div>
            )}
            <div className='flex justify-center items-center space-x-4'>
              <button
                onClick={() => cancelModal()}
                type='button'
                className='py-2 px-3 text-sm font-medium text-gray-800 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600'
              >
                No, cancel
              </button>
              <button
                onClick={() => deleteDoc()}
                type='submit'
                className='inline-flex items-center py-2 px-3 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900'
              >
                <Icon icon='material-symbols:delete' className='w-4 h-4' />
                Yes, confirm delete
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
