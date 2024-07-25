import React, { useContext } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';

import { ModalContext } from '../../context/ModalContext';

export default function DeleteModal ({ title, deleteDoc, message }) {
  // const { setDeleteModal, setCurrentItem, setDeleteItem } = useContext(AuthContext);
  const { closeModal } = useContext(ModalContext);
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50'
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className='relative p-4 w-full max-w-md'
        >
          <div className='relative bg-white rounded-lg shadow-lg dark:bg-gray-700 p-6 text-center'>
            <div className='mb-6'>
              <Icon icon='carbon:warning' className='text-yellow-400 w-24 h-24 mx-auto' />
            </div>
            {title && (
              <h3 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>
                {title}
              </h3>
            )}
            {message && (
              <p className='mb-6 text-lg text-gray-500 dark:text-gray-300'>
                {message}
              </p>
            )}
            <div className='flex justify-center items-center space-x-4'>
              <button
                onClick={deleteDoc}
                type='button'
                className='px-5 py-2.5 text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900 transition duration-300 ease-in-out'
              >
                Yes, delete it!
              </button>
              <button
                onClick={() => {
                  closeModal('delete');
                }}
                type='button'
                className='px-5 py-2.5 text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:ring-gray-300 rounded-lg border border-gray-200 text-sm font-medium dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-600 dark:focus:ring-gray-600 transition duration-300 ease-in-out'
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
