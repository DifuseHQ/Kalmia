import React, { useContext, useEffect, useState } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Editor } from 'primereact/editor';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import DeleteModal from '../DeleteModal/DeleteModal';
import instance from '../../api/AxiosInstance';
import { toastMessage } from '../../utils/Toast';

export default function EditPage () {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('id');
  const dir = searchParams.get('dir');
  const pageId = searchParams.get('pageId');
  const pageGroupId = searchParams.get('pageGroupId');
  const groupName = searchParams.get('group_name');
  const { refreshData } = useContext(AuthContext);

  const navigate = useNavigate();
  const [pageData, setPageData] = useState({});
  const [isDelete, setIsDelete] = useState(false);

  const [tempPageData, setTempPageData] = useState({});

  const updateContent = (newContent, name) => {
    setPageData((prevPageData) => ({
      ...prevPageData,
      [name]: newContent
    }));
  };

  const isDataChanged = () => {
    return (
      pageData.title !== tempPageData.title ||
      pageData.slug !== tempPageData.slug ||
      pageData.content !== tempPageData.content
    );
  };

  const isChanged = isDataChanged();
  useEffect(() => {
    const fetchdata = async () => {
      try {
        const response = await instance.post('docs/page', {
          id: Number(pageId)
        });
        if (response?.status === 200) {
          setPageData(response?.data);
          setTempPageData(response?.data);
        }
      } catch (err) {
        if (!err.response) {
          toastMessage(err?.message, 'error');
          navigate('/server-down');
        }
        toastMessage(err?.response?.data?.message, 'error');
      }
    };

    fetchdata();
  }, [pageId, navigate]);

  const handleEdit = async () => {
    try {
      const response = await instance.post('/docs/page/edit', {
        title: pageData?.title,
        slug: pageData?.slug,
        content: pageData?.content,
        id: Number(pageId)
      });

      if (response?.status === 200) {
        toastMessage(response?.data.message, 'success');
        if (dir === 'true') {
          refreshData();
          navigate(`/dashboard/documentation?id=${docId}`);
        } else {
          refreshData();
          navigate(
            `/dashboard/documentation/pagegroup?id=${docId}&pageGroupId=${pageGroupId}`
          );
        }
      }
    } catch (err) {
      if (!err.response) {
        toastMessage(err?.message, 'error');
        navigate('/server-down');
      }
      toastMessage(err?.response?.data?.message, 'error');
    }
  };

  const handleCloseDelete = () => {
    setIsDelete(false);
  };

  const handleDelete = async () => {
    try {
      const response = await instance.post('docs/page/delete', {
        id: Number(pageId)
      });
      if (response?.status === 200) {
        toastMessage(response?.data?.message, 'success');
        if (dir === 'true') {
          refreshData();
          navigate(`/dashboard/documentation?id=${docId}`);
        } else {
          refreshData();
          navigate(
            `/dashboard/documentation/pagegroup?id=${docId}&pageGroupId=${pageGroupId}`
          );
        }
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
      {isDelete && (
        <DeleteModal
          cancelModal={handleCloseDelete}
          deleteDoc={handleDelete}
          id={pageData.id}
          title='Are you sure?'
          message={`You.re permanently deleting "${pageData.title}"`}
        />
      )}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        className='flex mb-5'
        aria-label='Breadcrumb'
      >
        <ol className='inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse'>
          <li className='inline-flex items-center'>
            <p className='inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white'>
              <Icon icon='material-symbols:home' className=' ' />
              Home
            </p>
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
                <Icon icon='mingcute:right-fill' className='text-gray-500' />
                <Link
                  to={`/dashboard/documentation/pagegroup?id=${docId}&pageGroupId=${pageGroupId}`}
                  className='ms-1 text-sm font-medium text-gray-800 md:ms-2 dark:text-gray-400'
                >
                  {groupName}
                </Link>
              </div>
            </li>
          )}
          <li aria-current='page'>
            <div className='flex items-center'>
              <Icon icon='mingcute:right-fill' className='text-gray-500' />
              <span className='ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400'>
                Edit page
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
        className='flex  items-center w-full md:inset-0 h-modal md:h-full'
      >
        <div className=' h-full md:h-auto'>
          <div className='relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5'>
            <div className='flex justify-start items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600'>
              <h3 className='text-2xl  font-semibold text-gray-900 dark:text-white'>
                Edit Page
              </h3>
            </div>

            <div className='grid gap-4 mb-4 '>
              <div>
                <label
                  htmlForfor='title'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Title
                </label>
                <input
                  type='text'
                  required
                  value={pageData.title}
                  onChange={(e) => updateContent(e.target.value, e.target.name)}
                  name='title'
                  id='title'
                  className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                  placeholder='Page title'
                />
              </div>

              <div>
                <label
                  htmlForfor='slug'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Slug
                </label>
                <input
                  type='text'
                  required
                  value={pageData.slug}
                  onChange={(e) => updateContent(e.target.value, e.target.name)}
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
                <Editor
                  value={pageData.content}
                  onTextChange={(e) => updateContent(e.htmlValue, 'content')}
                  style={{ minHeight: '150px' }}
                />
              </div>
            </div>

            <div className='flex justify-center gap-5'>
              <button
                disabled={!isDataChanged()}
                onClick={handleEdit}
                type='submit'
                className={`text-white inline-flex items-center ${
                  isChanged
                    ? 'bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800'
                    : 'bg-gray-400'
                }  focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center `}
              >
                <Icon
                  icon='material-symbols:edit-outline'
                  className='w-6 h-6 text-yellow-500 dark:text-yellow-400'
                />
                Edit
              </button>

              <button
                whileHover={{ scale: 1.1 }}
                onClick={() => setIsDelete(!isDelete)}
                className='flex cursor-pointer items-center bg-red-600 text-white px-2  focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-smpy-2.5 text-center'
              >
                Delete
                <Icon icon='material-symbols:delete' className='w-6 h-6' />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
