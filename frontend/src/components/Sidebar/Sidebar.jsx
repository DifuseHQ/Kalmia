import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import instance from '../../api/AxiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toastMessage } from '../../utils/Toast';
import { Icon } from '@iconify/react';

export default function Sidebar () {
  const [documentation, setDocumentation] = useState([]);
  const [openDropdowns, setOpenDropdowns] = useState([]);
  const { refresh, userDetails, setIsOpenModal } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const response = await instance.get('/docs/documentations');
        if (response?.status === 200) {
          setDocumentation(response?.data);
        }
      } catch (err) {
        if (!err.response) {
          toastMessage(err?.message, 'error');
          navigate('/server-down');
          return;
        }
        toastMessage(err?.response?.data?.message, 'error');
      }
    };
    fetchdata();
  }, [refresh, navigate]);

  const toggleDropdown = (index) => {
    const updatedDropdowns = [...openDropdowns];
    updatedDropdowns[index] = !updatedDropdowns[index];
    setOpenDropdowns(updatedDropdowns);
  };

  const handleCreateDocument = () => {
    navigate('/dashboard/create-documentation');
    setIsOpenModal(true);
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        className='fixed top-0 left-0 z-40 w-64 h-screen pt-14 transition-transform -translate-x-full bg-white border-r border-gray-200 md:translate-x-0 dark:bg-gray-800 dark:border-gray-700'
        aria-label='Sidenav'
        id='drawer-navigation'
      >
        <div className='overflow-y-auto py-5 px-3 h-full bg-white dark:bg-gray-800'>
          <form action='#' method='GET' className='md:hidden mb-2'>
            <label htmlFor='sidebar-search' className='sr-only'>
              Search
            </label>
            <div className='relative'>
              <div className='flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none'>
                <svg
                  className='w-5 h-5 text-gray-500 dark:text-gray-400'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    fillRule='evenodd'
                    clipRule='evenodd'
                    d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                  />
                </svg>
              </div>
              <input
                type='text'
                name='search'
                id='sidebar-search'
                className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                placeholder='Search'
              />
            </div>
          </form>
          <ul className='space-y-2'>
            <li>
              <motion.button
                whilehover={{ scale: 1.05 }}
                onClick={handleCreateDocument}
                className='flex w-full py-2 px-5 my-5 justify-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-md  text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800'
              >
                <span className=' px-1 text-left items-center dark:text-white text-md '>New Document</span>
                <Icon icon='ei:plus' className='w-7 h-7 dark:text-white' />
              </motion.button>
            </li>
            {!documentation || documentation.length <= 0
              ? (
                <li whilehover={{ scale: 1.08, originx: 0 }}>
                  <p className='flex cursor-default items-center p-5 w-full text-base font-normal text-gray-600 rounded-lg transition duration-75 group '>
                    <span className='flex-1 ml-3 text-left whitespace-nowrap'>
                      No documentations
                    </span>
                  </p>
                </li>
                )
              : (
                  documentation.map((val, index) => (
                    <motion.li
                      key={`sidebar-${val.id}-${index}`}
                      whilehover={{ scale: 1.08, originx: 0 }}
                    >
                      <Link to={`/dashboard/documentation?id=${val.id}`}>
                        <button
                          type='button'
                          onClick={() => toggleDropdown(index)}
                          className='flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700'
                          aria-controls={`${val.name}`}
                          title={val.name}
                        >
                          <Icon icon='ep:document' className='w-8 h-8 dark:text-white' />
                          <span className='flex-1 px-1 text-left overflow-hidden text-md whitespace-nowrap overflow-ellipsis'>
                            {val.name}
                          </span>
                        </button>
                      </Link>
                    </motion.li>
                  ))
                )}
          </ul>

          {userDetails && userDetails.Admin && (
            <ul className='pt-5 mt-5 space-y-2 border-t border-gray-200 dark:border-gray-700'>
              <li>
                <Link to='/dashboard/admin/user-list'>
                  <button
                    type='button'
                    className='flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700'
                    aria-controls=''
                    title='User management'
                  >
                    <Icon icon='mdi:users' className='w-8 h-8 dark:text-white' />
                    <span className='flex-1 px-1 text-left whitespace-nowrap text-md'>
                      User Management
                    </span>
                  </button>
                </Link>
              </li>
            </ul>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
