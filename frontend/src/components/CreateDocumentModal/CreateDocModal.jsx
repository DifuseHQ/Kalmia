import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { AuthContext } from '../../context/AuthContext';
import { handleError } from '../../utils/Common';
import { toastMessage } from '../../utils/Toast';
import { createDocumentation } from '../../api/Requests';

export default function CreateDocModal () {
  const navigate = useNavigate();
  const { refreshData, isOpenModal, setIsOpenModal } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCloseModal = () => {
    setIsOpenModal(false);
  };

  const handleCreateDocument = async () => {
    if (formData.title === '') {
      toastMessage('Title is required. Please enter a new Document Title.', 'warning');
      return;
    }

    if (formData.description === '') {
      toastMessage('Description is required. Please enter a new Document Description.', 'warning');
      return;
    }

    const result = await createDocumentation({
      name: formData.title,
      description: formData.description
    });

    if (result.status === 'success') {
      setIsOpenModal(false);
      refreshData();
      toastMessage('Document created successfully', 'success');
    } else {
      handleError(result, navigate);
    }
  };

  return (
    <AnimatePresence>
      {isOpenModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50'
          key='create-documentation'
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className='relative p-4 w-full max-w-xl'
            key='create-documentation-2'
          >
            <div className='relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5'>
              <div className='flex justify-between items-center mb-4 sm:mb-5 dark:border-gray-600'>
                <div className='flex-grow text-center'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    New Documentation
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
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
                    onChange={handleChange}
                    type='text'
                    name='title'
                    id='title'
                    className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                    placeholder='Enter new document title'
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor='description'
                    className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                  >
                    Description
                  </label>
                  <div className='py-2'>
                    <textarea
                      onChange={handleChange}
                      name='description'
                      id='description'
                      className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                      placeholder='Description about your new document'
                      rows='3'
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateDocument}
                  type='button'
                  className='flex justify-center items-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'
                >
                  <span>New Documentation</span>
                  <Icon icon='ei:plus' className='w-6 h-6' />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
