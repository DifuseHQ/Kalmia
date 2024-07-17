import React, { useContext, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react/dist/iconify.js';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { toastMessage } from '../../utils/Toast';
import { AuthContext } from '../../context/AuthContext';
import instance from '../../api/AxiosInstance';
import EditorComponent from '../EditorComponent/EditorComponent';

export default function CreatePageModal () {
  const [searchParam] = useSearchParams();
  const docId = searchParam.get('id');
  const dir = searchParam.get('dir');
  const pageGroupId = searchParam.get('pageGroupId');
  const { refreshData } = useContext(AuthContext);

  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');

  const handleCreate = async () => {
    if (title === '' || slug === '') {
      toastMessage('Title and Slug required', 'warning');
      return;
    }

    if (dir === 'true') {
      try {
        const response = await instance.post('docs/page/create', {
          title,
          slug,
          content: JSON.stringify(content),
          documentationSiteId: Number(docId)
        });

        if (response?.status === 200) {
          refreshData();
          toastMessage(response?.data?.message, 'success');
          navigate(`/dashboard/documentation?id=${docId}`);
        }
      } catch (err) {
        if (!err.response) {
          toastMessage(err?.message, 'error');
          navigate('/server-down');
        }
        toastMessage(err?.response?.data?.message, 'error');
      }
    } else if (dir === 'false') {
      try {
        const response = await instance.post('docs/page/create', {
          title,
          slug,
          content: JSON.stringify(content),
          documentationSiteId: Number(docId),
          pageGroupId: Number(pageGroupId)
        });

        if (response?.status === 200) {
          refreshData();
          toastMessage(response?.data?.message, 'success');
          navigate(
            `/dashboard/documentation/pagegroup?id=${docId}&pageGroupId=${pageGroupId}`
          );
        }
      } catch (err) {
        if (!err.response) {
          toastMessage(err?.message, 'error');
          navigate('/server-down');
        }
        toastMessage(err?.response?.data?.message, 'error');
      }
    }
  };

  const handleSave = async (content) => {
    setContent(content);
  };

  return (
    <AnimatePresence>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        className='flex mb-10'
        aria-label='Breadcrumb'
      >
        <ol className='inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse'>
          <li className='inline-flex items-center'>
            <Link
              to='/dashboard'
              className='inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white'
            >
              <Icon icon='material-symbols:home' className=' ' />
              Home
            </Link>
          </li>
          <li>
            <div className='flex items-center'>
              <Icon icon='mingcute:right-fill' className='text-gray-500' />
              <Link
                to={`/dashboard/documentation?id=${docId}`}
                className='ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white'
              >
                Documentation
              </Link>
            </div>
          </li>
          {pageGroupId && (
            <li aria-current='page'>
              <div className='flex items-center'>

                <Link
                  to={`/dashboard/documentation/pagegroup?id=${docId}&pageGroupId=${pageGroupId}`}
                  className='ms-1 text-sm font-medium text-gray-800 md:ms-2 dark:text-gray-400'
                >
                  PageGroup
                </Link>
              </div>
            </li>
          )}
          <li aria-current='page'>
            <div className='flex items-center'>
              <Icon icon='mingcute:right-fill' className='text-gray-500' />
              <span className='ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400'>
                create page
              </span>
            </div>
          </li>
        </ol>
      </motion.nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        id='defaultModal'
        tabindex='-1'
        aria-hidden='true'
        className='flex w-full md:inset-0 h-modal md:h-full'
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
                  for='content'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Content
                </label>
                <div className='border border-gray-400 rounded-lg'>
                  <EditorComponent onSave={handleSave} />
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
