import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import instance from '../../api/AxiosInstance';
import { AnimatePresence, motion } from 'framer-motion';
import ClipLoader from 'react-spinners/ClipLoader';
import { Link, useNavigate } from 'react-router-dom';
import DeleteModal from '../DeleteModal/DeleteModal';
import { toastMessage } from '../../utils/Toast';
import { Icon } from '@iconify/react';

export default function UserList () {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const navigate = useNavigate();
  const [currentItem, setCurrentItem] = useState(null);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const { refresh, refreshData } = useContext(AuthContext);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const response = await instance.get('/auth/users');
        if (response?.status === 200) {
          setUserList(response?.data || []);
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
        if (!err.response) {
          toastMessage(err?.message, 'error');
          navigate('/server-down');
        }
        toastMessage(err?.response?.data?.message, 'error');
      }
    };
    fetchData();
  }, [refresh, navigate]);

  // Filtered user list based on search term
  const filterUser = userList.filter(
    (user) =>
      user.Admin === false &&
      (user.Username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.Email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  // Handle opening delete modal
  const openDeleteModal = (item) => {
    setCurrentItem(item);
    setIsDeleteModal(true);
  };

  // Handle cancel delete action
  const handleCancelDelete = () => {
    setIsDeleteModal(false);
    setCurrentItem(null);
  };

  // Handle delete user action
  const handleDeleteUser = async (username) => {
    if (!username) {
      toastMessage('Something went wrong, try again', 'error');
      setCurrentItem(null);
      return;
    }

    try {
      const response = await instance.post('/auth/user/delete', {
        username
      });
      if (response?.status === 200) {
        refreshData();
        toastMessage('User deleted successfully', 'success');
        setIsDeleteModal(false);
        navigate('/dashboard/admin/user-list');
      }
    } catch (err) {
      if (!err.response) {
        toastMessage(err?.message, 'error');
        navigate('/server-down');
      }
      toastMessage(err?.response?.data?.message, 'error');
    }
  };

  // Calculate pagination indices
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const totalItems = filterUser.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Handle page change
  const handlePageChange = useCallback(
    (pageNumber) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
      }
    },
    [totalPages]
  );

  return (
    <AnimatePresence className='bg-gray-50 dark:bg-gray-900 p-3 sm:p-5'>

      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='flex pb-10'
        aria-label='Breadcrumb'
      >
        <ol className='inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse'>
          <li className='inline-flex items-center '>
            <span

              className='inline-flex items-center gap-1 text-md font-medium text-gray-500  dark:text-gray-400 cursor-text'
            >
              <Icon icon='material-symbols:home' className='text-gray-500 dark:text-white ' />
              user management
            </span>
          </li>
        </ol>
      </motion.nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='mx-auto max-w-screen-xl justify-start pr-4 lg:pr-12'
      >
        <div className='bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden'>
          <div className='flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4'>
            <div className='w-full md:w-1/2'>
              <form className='flex items-center'>
                <label htmlFor='simple-search' className='sr-only'>
                  Search
                </label>
                <div className='relative w-full'>
                  <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                    <svg
                      aria-hidden='true'
                      className='w-5 h-5 text-gray-500 dark:text-gray-400'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        fillRule='evenodd'
                        d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <input
                    type='text'
                    id='simple-search'
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                    placeholder='Search'
                    required=''
                  />
                </div>
              </form>
            </div>

            <button className='w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0'>
              <Link
                to='/dashboard/admin/create-user'
                className='flex text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'
              >
                <span className=' px-1 pt-0.5 text-left items-center dark:text-white text-md'>Add User</span>
                <Icon icon='ei:plus' className='w-6 h-6 dark:text-white' />
              </Link>
            </button>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left text-gray-500 dark:text-gray-400'>
              <thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
                <tr>
                  <th scope='col' className='px-4 py-3'>
                    Username
                  </th>
                  <th scope='col' className='px-4 py-3'>
                    Email
                  </th>
                  {/* <th scope="col" className="px-4 py-3">
                    Edit
                  </th> */}
                  <th scope='col' className='px-4 py-3'>
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className='border-b dark:border-gray-700'>
                    <td colSpan='4' className='py-8'>
                      <div className='flex flex-col items-center justify-center'>
                        <ClipLoader
                          color='#666161'
                          loading={loading}
                          size={100}
                          aria-label='Loading Spinner'
                          data-testid='loader'
                        />
                        <h1 className='text-xl font-bold text-center text-gray-500 mt-4'>
                          Loading....
                        </h1>
                      </div>
                    </td>
                  </tr>
                ) : !filterUser || filterUser.length <= 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='border-b dark:border-gray-700'
                  >
                    <td colSpan='4' className='text-center py-8'>
                      <h1 className='text-center text-gray-600 sm:text-lg font-semibold'>
                        No user found
                      </h1>
                    </td>
                  </motion.tr>
                ) : (
                  <>
                    {filterUser.slice(startIdx, endIdx).map((user) => (
                      <motion.tr
                        className='border-b dark:border-gray-700'
                        key={user.ID}
                      >
                        <th
                          scope='row'
                          className='px-4 py-3 text-md font-medium text-black whitespace-nowrap dark:text-white'
                        >
                          {user.Username}
                        </th>
                        <td className='px-4 py-3 text-md text-black dark:text-white'>{user.Email}</td>
                        {/* <td className="px-4 py-3">
                          <button className="text-blue-500 border px-3 border-blue-500 rounded-lg hover:bg-blue-500 hover:text-white">
                            Edit
                          </button>
                        </td> */}
                        <td className='px-4 py-3'>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className='text-red-500 px-2 border-red-500 rounded-lg hover:bg-red-500 hover:text-white'
                          >
                            <Icon icon='material-symbols:delete' className='w-5 h-5' />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {filterUser && filterUser.length > 0 && (
            <nav
              className='flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4'
              aria-label='Table navigation'
            >
              <span className='text-sm font-normal text-gray-500 dark:text-gray-400'>
                Showing{' '}
                <span className='font-semibold text-gray-900 dark:text-white mx-1'>
                  {startIdx + 1}-{Math.min(endIdx, totalItems)}
                </span>{' '}
                of{' '}
                <span className='font-semibold text-gray-900 dark:text-white mx-1'>
                  {totalItems}
                </span>{' '}
                users
              </span>
              <ul className='inline-flex items-stretch -space-x-px'>
                <li>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className='flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                  >
                    <span className='sr-only'>Previous</span>
                    <svg
                      className='w-5 h-5'
                      aria-hidden='true'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        fillRule='evenodd'
                        d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i}>
                    <button
                      onClick={() => handlePageChange(i + 1)}
                      className={`flex items-center justify-center text-sm py-2 px-3 leading-tight ${
                        currentPage === i + 1
                          ? 'text-primary-600 bg-primary-50 border border-primary-300 hover:bg-primary-100 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                      }`}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className='flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                  >
                    <span className='sr-only'>Next</span>
                    <svg
                      className='w-5 h-5'
                      aria-hidden='true'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        fillRule='evenodd'
                        d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
        {isDeleteModal && currentItem && (
          <DeleteModal
            cancelModal={handleCancelDelete}
            deleteDoc={() => handleDeleteUser(currentItem.Username)}
            id={currentItem.id}
            title={`Are you sure you want to delete this user "${currentItem.Username}"`}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
