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
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          className='relative p-4 w-full max-w-xl'
        >
          <div className='relative p-4 text-center bg-gray-200 rounded-lg shadow dark:bg-gray-800 sm:p-5'>
            <button
              onClick={() => cancelModal()}
              type='button'
              className='text-gray-400 absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white'
            >
              <Icon icon='material-symbols:close' className='w-6 h-6' />
              <span className='sr-only'>Close modal</span>
            </button>
            <div className='flex justify-center'><Icon icon='carbon:warning' className='text-yellow-500 w-20 h-20' /></div>
            {title && (
              <h3 className=' text-3xl font-semibold text-gray-900 dark:text-white'>
                {title}
              </h3>
            )}
            {message && (
              <div
                className='flex justify-center my-5 text-lg text-left text-black  rounded-lg bg-orange-100 p-3   dark:bg-gray-500'
                role='alert'
              >
                <p>{message}</p>
              </div>
            )}
            <div className='flex justify-center items-center space-x-4'>
              <button
                onClick={() => deleteDoc()}
                type='submit'
                className='inline-flex items-center py-2 px-3 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900'
              >
                <Icon icon='material-symbols:delete' className='w-4 h-4' />
                Yes, confirm delete
              </button>
              <button
                onClick={() => cancelModal()}
                type='button'
                className='py-2 px-3 text-sm font-medium  text-white dark:bg-blue-500 bg-blue-600 dark:hover:bg-blue-700 rounded-lg  hover:bg-blue-700  '
              >
                No, cancel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
