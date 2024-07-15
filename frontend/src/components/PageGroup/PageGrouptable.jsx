import React, { useEffect, useState } from 'react';
import instance from '../../api/AxiosInstance';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import CreatePageGroup from '../CreatePageGroup/CreatePageGroup';
import { toastMessage } from '../../utils/Toast';
import EditDocumentModal from '../CreateDocumentModal/EditDocumentModal';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DeleteModal from '../DeleteModal/DeleteModal';

export default function PageGrouptable () {
  const [pageRefresh, setPageRefresh] = useState(false);
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('id');
  const pageGroupId = searchParams.get('pageGroupId');
  const [groupDetail, setGroupDetail] = useState([]);
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  const refreshPage = () => {
    setPageRefresh(!refreshPage);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await instance.post('docs/page-group', {
          id: Number(pageGroupId)
        });
        if (response?.status === 200) {
          setGroupDetail(response?.data);
          const groupData = response?.data?.pageGroups ?? [];
          const pages = response?.data?.pages ?? [];
          if (Array.isArray(groupData) && Array.isArray(pages)) {
            const combinedPages = [...groupData, ...pages];
            combinedPages.sort((a, b) => {
              const orderA = a.order !== null ? a.order : Infinity;
              const orderB = b.order !== null ? b.order : Infinity;

              if (orderA !== orderB) {
                return orderA - orderB;
              } else {
                return combinedPages.indexOf(a) - combinedPages.indexOf(b);
              }
            });

            setData(combinedPages);

            setPageRefresh();
          } else {
            console.error('Unexpected data structure', { groupData, pages });
          }
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

    fetchData();
  }, [pageGroupId, pageRefresh, navigate]);

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    // setCurrentPage(1); // Reset to the first page on search
  };

  const filteredItems = data.filter(
    (obj) =>
      (obj.parentId === Number(pageGroupId) ||
        obj.pageGroupId === Number(pageGroupId)) &&
      (obj.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const [openCreatePageGroup, setOpenCreatePageGroup] = useState(false);

  const CreatePageGroupModalClose = () => {
    setOpenCreatePageGroup(false);
  };

  const handleCreatePageGroup = async (title) => {
    if (title === '') {
      toastMessage('Title is required. Please Enter PageGroup title', 'warning');
      return;
    }

    try {
      const response = await instance.post('docs/page-group/create', {
        name: title,
        documentationSiteId: Number(docId),
        parentId: Number(pageGroupId)
      });

      if (response?.status === 200) {
        setOpenCreatePageGroup(false);
        refreshPage();
        toastMessage(response?.data?.message, 'success');
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

  const [openDropdownId, setOpenDropdownId] = useState(null);

  const toggleDropdown = (currentIndex) => {
    setOpenDropdownId((prevId) =>
      prevId === currentIndex ? null : currentIndex
    );
  };

  const [isEditpageGroup, setIsEditpageGroup] = useState(false);
  const [isPageGroupsDeleteModal, setIsPageGroupsDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  // PageGroup CRUD function
  const openDeletePageGroups = (item) => {
    setCurrentItem(item);
    setIsPageGroupsDeleteModal(true);
  };

  const handleCancelPagegroupDelete = () => {
    setIsPageGroupsDeleteModal(false);
    setCurrentItem(null);
  };

  const handleDeletePageGroup = async (id) => {
    try {
      const response = await instance.post('docs/page-group/delete', {
        id: Number(id)
      });
      if (response?.status === 200) {
        toastMessage(response?.data?.message, 'success');
        setIsPageGroupsDeleteModal(false);
        refreshPage();
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

  const openEditPageGroup = (item) => {
    setCurrentItem(item);
    setIsEditpageGroup(true);
  };

  const handleEditPageGroupClose = () => {
    setIsEditpageGroup(false);
    setCurrentItem(null);
  };

  const handelPageGroupUpdate = async (editTitle, editDescription, id) => {
    try {
      const response = await instance.post('docs/page-group/edit', {
        id: Number(id),
        name: editTitle,
        documentationSiteId: Number(docId)
      });

      if (response?.status === 200) {
        setIsEditpageGroup(false);
        refreshPage();
        toastMessage(response?.data?.message, 'success');
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

  const handleDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const newItems = Array.from(data);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setData(newItems);

    const updateOrder = async (item, index) => {
      try {
        if (item?.name) {
          await instance.post('/docs/page-group/reorder', {
            id: item.id,
            documentationId: Number(docId),
            parentId: Number(pageGroupId),
            order: index
          });
        } else {
          await instance.post('/docs/page/reorder', {
            id: item.id,
            documentationId: Number(docId),
            pageGroupId: Number(pageGroupId),
            order: index
          });
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

    // // Use map instead of forEach to iterate asynchronously
    await Promise.all(newItems.map((item, index) => updateOrder(item, index)));

    refreshPage();
  };

  return (
    <AnimatePresence className='bg-gray-50 dark:bg-gray-900 p-3 sm:p-5'>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='flex mb-5'
        aria-label='Breadcrumb'
      >
        <ol className='inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse'>
          <li className='inline-flex items-center'>
            <Link
              to='/dashboard'
              className='inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white'
            >
              <svg
                className='w-3 h-3 me-2.5'
                aria-hidden='true'
                xmlns='http://www.w3.org/2000/svg'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path d='m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z' />
              </svg>
              Home
            </Link>
          </li>
          <li>
            <div className='flex items-center'>
              <svg
                className='rtl:rotate-180 w-3 h-3 text-gray-400 mx-1'
                aria-hidden='true'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 6 10'
              >
                <path
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='m1 9 4-4-4-4'
                />
              </svg>
              <Link
                to={`/dashboard/documentation?id=${docId}`}
                className='ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white'
              >
                Documentation
              </Link>
            </div>
          </li>
          <li aria-current='page'>
            <div className='flex items-center'>
              <svg
                className='rtl:rotate-180 w-3 h-3 text-gray-400 mx-1'
                aria-hidden='true'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 6 10'
              >
                <path
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='m1 9 4-4-4-4'
                />
              </svg>
              <span className='ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400'>
                {/* {data.name} */}
              </span>
            </div>
          </li>
        </ol>
      </motion.nav>

      {openCreatePageGroup && (
        <CreatePageGroup
          closeModal={CreatePageGroupModalClose}
          handleCreate={handleCreatePageGroup}
        />
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='grid max-w-screen-xl px-4 mx-auto lg:gap-8 xl:gap-0 lg:grid-cols-12'
      >
        <div className='mr-auto place-self-center lg:col-span-7'>
          <h1 className='max-w-xl mb-4 text-4xl font-bold tracking-tight leading-none md:text-4xl xl:text-4xl dark:text-white'>
            {groupDetail.name}
          </h1>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        className='mx-auto max-w-screen-xl px-4 lg:px-12'
      >
        <div className='bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden'>
          <div className='flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4'>
            <div className='w-full md:w-1/3'>
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
            <div className='w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0'>
              <motion.button
                onClick={() => setOpenCreatePageGroup(true)}
                whileHover={{ scale: 1.1 }}
                type='button'
                className='flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800'
              >
                Create Group
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }}>
                <Link
                  to={`/dashboard/documentation/create-page?id=${docId}&dir=false&pageGroupId=${pageGroupId}`}
                  className='flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800'
                >
                  Create page
                </Link>
              </motion.button>
            </div>
          </div>

          <div className='overflow-x-auto min-h-[70vh]'>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId='table' type='TABLE'>
                {(provided) => (
                  <table className='w-full text-sm text-left text-gray-500 dark:text-gray-400'>
                    <thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
                      <tr>
                        <th scope='col' className='px-4 py-3' />
                        <th scope='col' className='px-4 py-3'>
                          Title
                        </th>
                        <th scope='col' className='px-4 py-3'>
                          Path
                        </th>
                        <th scope='col' className='px-4 py-3'>
                          Extension
                        </th>
                        <th scope='col' className='px-4 py-3'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody {...provided.droppableProps} ref={provided.innerRef}>
                      {filteredItems.length <= 0 && (
                        <tr className='border-b dark:border-gray-700'>
                          <td colSpan='4' className='text-center py-8'>
                            <h1 className='text-center text-gray-600 sm:text-lg font-semibold'>
                              No Pages Found
                            </h1>
                          </td>
                        </tr>
                      )}

                      {filteredItems.map((obj, index) => (
                        <Draggable
                          key={`${obj.id}-${index}`}
                          draggableId={`${obj.id.toString()}-${
                            obj.name || obj.title
                          }`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${
                                snapshot.isDragging
                                  ? 'opacity-80 bg-gray-200 border shadow-md shadow-black text-black'
                                  : ''
                              } border dark:border-gray-700 h-16 dark:bg-gray-700`}
                              key={`${obj.id}-${index}`}
                            >
                              <th
                                scope='row'
                                className='items-center w-5 cursor-pointer gap-2 px-4 py-3 font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap dark:text-white'
                              >
                                <svg
                                  fill='#000000'
                                  className='w-6 h-6'
                                  viewBox='0 0 256 256'
                                  id='Flat'
                                  xmlns='http://www.w3.org/2000/svg'
                                >
                                  <path d='M104,60.0001a12,12,0,1,1-12-12A12,12,0,0,1,104,60.0001Zm60,12a12,12,0,1,0-12-12A12,12,0,0,0,164,72.0001Zm-72,44a12,12,0,1,0,12,12A12,12,0,0,0,92,116.0001Zm72,0a12,12,0,1,0,12,12A12,12,0,0,0,164,116.0001Zm-72,68a12,12,0,1,0,12,12A12,12,0,0,0,92,184.0001Zm72,0a12,12,0,1,0,12,12A12,12,0,0,0,164,184.0001Z' />
                                </svg>
                              </th>

                              <th
                                scope='row'
                                className='  cursor-pointer gap-2 px-4 py-3 font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap dark:text-white'
                              >
                                <Link
                                  className='flex'
                                  to={
                                    obj.name
                                      ? `/dashboard/documentation/pagegroup?id=${docId}&pageGroupId=${obj.id}`
                                      : `/dashboard/documentation/edit-page?id=${docId}&dir=false&pageGroupId=${pageGroupId}&page_id=${obj.id}`
                                  }
                                >
                                  {obj.name
                                    ? (
                                      <svg
                                        className='w-6 h-6 text-yellow-400 dark:text-white'
                                        aria-hidden='true'
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='24'
                                        height='24'
                                        fill='currentColor'
                                        viewBox='0 0 24 24'
                                      >
                                        <path
                                          fillRule='evenodd'
                                          d='M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 .087.586l2.977-7.937A1 1 0 0 1 6 10h12V9a2 2 0 0 0-2-2h-4.532l-1.9-2.28A2 2 0 0 0 8.032 4H4Zm2.693 8H6.5l-3 8H18l3-8H6.693Z'
                                          clipRule='evenodd'
                                        />
                                      </svg>
                                      )
                                    : (
                                      <svg
                                        className='w-6 h-6 text-gray-600 dark:text-white'
                                        aria-hidden='true'
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='24'
                                        height='24'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                      >
                                        <path
                                          stroke='currentColor'
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                          strokeWidth='2'
                                          d='M10 3v4a1 1 0 0 1-1 1H5m4 8h6m-6-4h6m4-8v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z'
                                        />
                                      </svg>
                                      )}

                                  {obj.name || obj.title}
                                </Link>
                              </th>

                              <td className='px-4 py-3'>
                                /{obj.name || obj.slug}
                              </td>

                              <td className='px-4 py-3'>
                                {obj.name ? 'Folder' : 'file'}
                              </td>
                              {obj.name && (
                                <td className='px-4 py-3 cursor-pointer relative'>
                                  <button
                                    onClick={() => toggleDropdown(index)}
                                    id={`dropdown-button-${obj.id}`}
                                    data-dropdown-toggle={`dropdown-${obj.id}`}
                                    className='inline-flex items-center p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100'
                                    type='button'
                                  >
                                    <svg
                                      className='w-5 h-5'
                                      aria-hidden='true'
                                      fill='currentColor'
                                      viewBox='0 0 20 20'
                                      xmlns='http://www.w3.org/2000/svg'
                                    >
                                      <path d='M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z' />
                                    </svg>
                                  </button>
                                  <div
                                    id={`dropdown-${obj.id}`}
                                    className={`absolute z-10 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600 ${
                                      openDropdownId === index
                                        ? 'block'
                                        : 'hidden'
                                    }`}
                                    style={{ top: '100%', right: 0 }}
                                  >
                                    <ul
                                      className='py-1 text-sm text-gray-700 dark:text-gray-200'
                                      aria-labelledby={`dropdown-button-${obj.id}-${index}`}
                                    >
                                      <li key={`dropsown-${obj.id}-${index}`}>
                                        <p
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            openEditPageGroup(obj);
                                          }}
                                          className='block py-2 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white'
                                        >
                                          Edit
                                        </p>
                                      </li>
                                      <li>
                                        <p
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            openDeletePageGroups(obj);
                                          }}
                                          className='block py-2 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white'
                                        >
                                          Delete
                                        </p>
                                      </li>
                                    </ul>
                                  </div>
                                </td>
                              )}
                            </tr>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}
                    </tbody>
                  </table>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </motion.div>

      {isEditpageGroup && currentItem && (
        <EditDocumentModal
          heading='Rename Page Group'
          title={currentItem.name}
          id={currentItem.id}
          closeModal={handleEditPageGroupClose}
          updateData={handelPageGroupUpdate}
        />
      )}
      {/* PageGroup delete Component */}
      {isPageGroupsDeleteModal && currentItem && (
        <DeleteModal
          cancelModal={handleCancelPagegroupDelete}
          deleteDoc={() => handleDeletePageGroup(currentItem.id)}
          id={currentItem.id}
          title='Are you sure? '
          message={`you want to delete this "${currentItem.name}"`}
        />
      )}
    </AnimatePresence>
  );
}
