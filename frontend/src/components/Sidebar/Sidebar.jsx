import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { AuthContext } from '../../context/AuthContext';
import instance from '../../api/AxiosInstance';
import { toastMessage } from '../../utils/Toast';

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
    setIsOpenModal(true);
  };

  const location = useLocation();
  const path = location.pathname + location.search;

  const smallestId = documentation.reduce((min, doc) => (doc.id < min ? doc.id : min), documentation[0]?.id);

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
          <ul className='space-y-2'>
            <li>
              <motion.button
                whilehover={{ scale: 1.05 }}
                onClick={handleCreateDocument}
                className='flex w-full py-2 px-5 my-5 justify-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-md  text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800'
              >
                <span className=' px-1 pt-0.5 text-left items-center dark:text-white text-md '>New Document</span>
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
                      <NavLink
                        to={`/dashboard/documentation?id=${val.id}`}
                        onClick={() => toggleDropdown(index)}
                        className={`flex items-center p-2 w-full text-base font-normal rounded-lg transition duration-75 group hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700 ${
                            (location.pathname === '/dashboard' && val.id === smallestId) || path === `/dashboard/documentation?id=${val.id}`
                              ? 'text-black-500 bg-gray-300 dark:bg-gray-600'
                              : 'text-gray-900'
                          }`}
                        aria-controls={`${val.name}`}
                        title={val.name}
                      >
                        <Icon icon='ep:document' className='w-8 h-8 dark:text-white' />
                        <span className='flex-1 px-1 text-left overflow-hidden text-md whitespace-nowrap overflow-ellipsis'>
                          {val.name}
                        </span>
                      </NavLink>
                    </motion.li>
                  ))
                )}
          </ul>

          {userDetails && userDetails.Admin && (
            <ul className='pt-5 mt-5 space-y-2 border-t border-gray-200 dark:border-gray-700'>
              <li>
                <NavLink
                  to='/dashboard/admin/user-list'
                  className={`flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700
                    ${path === '/dashboard/admin/user-list'
                      ? 'text-black-500 bg-gray-300'
                      : 'text-gray-900'}
                    `}
                  aria-controls=''
                  title='User management'
                >
                  <Icon icon='mdi:users' className='w-8 h-8 dark:text-white' />
                  <span className='flex-1 px-1 text-left whitespace-nowrap text-md'>
                    User Management
                  </span>
                </NavLink>
              </li>
            </ul>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
