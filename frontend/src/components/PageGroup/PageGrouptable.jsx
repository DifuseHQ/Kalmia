import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import instance from '../../api/AxiosInstance';
import CreatePageGroup from '../CreatePageGroup/CreatePageGroup';
import EditDocumentModal from '../CreateDocumentModal/EditDocumentModal';
import DeleteModal from '../DeleteModal/DeleteModal';
import { toastMessage } from '../../utils/Toast';

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
      toastMessage(
        'Title is required. Please Enter PageGroup title',
        'warning'
      );
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
          <li aria-current='page'>
            <div className='flex items-center'>
              <Icon icon='mingcute:right-fill' className='text-gray-500' />
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
        className='grid max-w-screen-xl  '
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
        className=''
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
                    <Icon
                      icon='material-symbols:search'
                      className='w-6 h-6 text-gray-400 dark:text-gray-500'
                    />
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
                whilehover={{ scale: 1.1 }}
                onClick={() => setOpenCreatePageGroup(true)}
                type='button'
                className='flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800'
              >
                <span className=' px-1 text-left items-center dark:text-white text-md '>
                  New Group
                </span>
                <Icon icon='ei:plus' className='w-6 h-6 dark:text-white' />
              </motion.button>

              <motion.button whilehover={{ scale: 1.1 }}>
                <Link
                  to={`/dashboard/documentation/create-page?id=${docId}&dir=true`}
                  className='flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800'
                >
                  <span className=' px-1 text-left items-center dark:text-white text-md '>
                    New Page
                  </span>
                  <Icon icon='ei:plus' className='w-6 h-6 dark:text-white' />
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
                                  ? 'opacity-80 bg-gray-200 dark:bg-gray-500 border shadow-md shadow-black text-black'
                                  : ''
                              } border dark:border-gray-700 h-16 `}
                              key={`${obj.id}-${index}`}
                            >
                              <th
                                scope='row'
                                className='items-center w-5 cursor-pointer gap-2 px-4 py-3 font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap dark:text-white'
                              >
                                <Icon
                                  icon='nimbus:drag-dots'
                                  className='w-6 h-6 text-gray-600 dark:text-white'
                                />
                              </th>

                              <th
                                scope='row'
                                className='  cursor-pointer px-4 py-3 font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap dark:text-white'
                              >
                                <Link
                                  className='flex items-center gap-1'
                                  to={
                                    obj.name
                                      ? `/dashboard/documentation/pagegroup?id=${docId}&pageGroupId=${obj.id}`
                                      : `/dashboard/documentation/edit-page?id=${docId}&dir=false&pageGroupId=${pageGroupId}&pageId=${obj.id}`
                                  }
                                >
                                  {obj.name
                                    ? (
                                      <Icon
                                        icon='material-symbols:folder'
                                        className='text-yellow-400 dark:text-yellow-200 w-6 h-6'
                                      />
                                      )
                                    : (
                                      <Icon
                                        icon='bx:file'
                                        className='w-6 h-6 text-gray-500 dark:text-white'
                                      />
                                      )}

                                  {obj.name || obj.title}
                                </Link>
                              </th>

                              <td className='px-4 py-3 cursor-text'>
                                <div className='flex justify-start items-center gap-2'>
                                  <Icon
                                    icon='mdi:clock-outline'
                                    className='w-4 h-4 text-gray-500 dark:text-white'
                                  />
                                  <span className=' px-1 text-left items-center dark:text-white text-md whitespace-nowrap'>
                                    Demo Time
                                  </span>
                                </div>
                                <div
                                  className='flex gap-2 items-center
                                      '
                                >
                                  <Icon
                                    icon='material-symbols:update'
                                    className='w-4 h-4 text-gray-500 dark:text-white'
                                  />
                                  <span className=' px-1 text-left items-center dark:text-white text-md whitespace-nowrap'>
                                    Demo Update Time
                                  </span>
                                </div>
                              </td>

                              <td className='px-4 py-3 cursor-text'>
                                <div className='flex justify-start items-center gap-2'>
                                  <Icon
                                    icon='mdi:user'
                                    className='w-4 h-4 text-gray-500 dark:text-white'
                                  />
                                  <span className=' px-1 text-left items-center dark:text-white text-md whitespace-nowrap'>
                                    Demo Author Name
                                  </span>
                                </div>
                                <div className='flex gap-2 items-center'>
                                  <Icon
                                    icon='mdi:edit-outline'
                                    className='w-4 h-4 text-gray-500 dark:text-white'
                                  />
                                  <span className=' px-1 text-left items-center dark:text-white text-md whitespace-nowrap'>
                                    Demo Editor Name
                                  </span>
                                </div>
                              </td>

                              {obj.name && (
                                <td className='px-4 py-3 cursor-pointer relative'>
                                  <button
                                    id={`dropdown-button-${obj.id}`}
                                    data-dropdown-toggle={`dropdown-${obj.id}`}
                                    className='inline-flex items-center gap-2 p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100'
                                    type='button'
                                  >
                                    <Icon
                                      icon='material-symbols:edit-outline'
                                      className='w-6 h-6 text-yellow-500 dark:text-yellow-400'
                                      onClick={() => {
                                        openEditPageGroup(obj);
                                      }}
                                    />
                                    <Icon
                                      icon='material-symbols:delete'
                                      className='w-6 h-6 text-red-600 dark:text-red-500'
                                      onClick={() => {
                                        openDeletePageGroups(obj);
                                      }}
                                    />
                                  </button>
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
          message={`You're permanently deleting "${currentItem.name}"`}
        />
      )}
    </AnimatePresence>
  );
}
