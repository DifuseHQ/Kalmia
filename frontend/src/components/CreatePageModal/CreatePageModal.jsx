import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react/dist/iconify.js';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { toastMessage } from '../../utils/Toast';
import { AuthContext } from '../../context/AuthContext';
import { createPage } from '../../api/Requests';
import { handleError } from '../../utils/Common';
import Breadcrumb from '../Breadcrumb/Breadcrumb';

export default function CreatePageModal () {
  const { refreshData } = useContext(AuthContext);
  const [searchParam] = useSearchParams();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content] = useState('');

  const navigate = useNavigate();
  const docId = searchParam.get('id');
  const dir = searchParam.get('dir');
  const pageGroupId = searchParam.get('pageGroupId');
  
  const inputRef = useRef(null);

  useEffect(()=>{
    if(inputRef.current){
      inputRef.current.focus()
    }
  },[])


  const handleCreate = async () => {
    if (title === '' || slug === '') {
      toastMessage('Title and Slug required', 'warning');
      return;
    }

    const pageData = {
      title,
      slug,
      content: JSON.stringify(content),
      documentationId: Number(docId)
    };

    if (dir === 'false') {
      pageData.pageGroupId = Number(pageGroupId);
    }

    const result = await createPage(pageData);

    if (result.status === 'success') {
      refreshData();
      toastMessage('Page created successfully', 'success');

      if (dir === 'true') {
        navigate(`/dashboard/documentation?id=${docId}`);
      } else {
        navigate(`/dashboard/documentation/page-group?id=${docId}&pageGroupId=${pageGroupId}`);
      }
    } else {
      handleError(result, navigate);
    }
  };

  return (
    <AnimatePresence>
      <Breadcrumb />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        id='defaultModal'
        tabIndex='-1'
        aria-hidden='true'
        className='flex w-full md:inset-0 h-modal md:h-full'
        key='create-page-1'
      >
        <div className='w-full h-full md:h-auto'>
          <div className='relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5'>
            <div className='flex justify-start items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600'>
              <h3 className='text-2xl  font-semibold text-gray-900 dark:text-white'>
                New Page
              </h3>
            </div>

            <div className='grid gap-4 mb-4 '>
              <div>
                <label
                  htmlFor='title'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Title
                </label>
                <input
                ref={inputRef}
                  type='text'
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  name='title'
                  id='title'
                  className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                  placeholder='Page title'
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
                  type='text'
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  name='slug'
                  id='slug'
                  className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                  placeholder='Page slug'
                />
              </div>

              <div className=''>
                <label
                  htmlFor='content'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Content
                </label>
                <div className='border border-gray-400 rounded-lg'>
                  {/* Use Same stuff as edit page */}
                </div>
              </div>
            </div>

            <div className='flex justify-center'>
              <button
                onClick={handleCreate}
                type='submit'
                className='text-white inline-flex items-center bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800'
              >
                <span className=' px-1 text-left items-center dark:text-white text-md '>New Page</span>
                <Icon icon='ei:plus' className='w-6 h-6 dark:text-white' />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
