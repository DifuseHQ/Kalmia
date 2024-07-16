import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Icon } from '@iconify/react';
import { AuthContext } from '../../context/AuthContext';
import instance from '../../api/AxiosInstance';
import EditDocumentModal from '../CreateDocumentModal/EditDocumentModal';
import DeleteModal from '../DeleteModal/DeleteModal';
import CreatePageGroup from '../CreatePageGroup/CreatePageGroup';
import { toastMessage } from '../../utils/Toast';

export default function Documentation () {
  const { refresh, refreshData, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParam] = useSearchParams();
  const docId = searchParam.get('id');

  const [loading, setLoading] = useState(false);

  // Documentation CRUD
  const [documentData, setDocumentData] = useState([]);
  const [isEditModal, setIsEditModal] = useState(false);
  const [isDeleteModal, setDeleteModal] = useState(false);

  // pageGroup CRUD
  const [isEditpageGroup, setIsEditpageGroup] = useState(false);
  const [isPageGroupsDeleteModal, setIsPageGroupsDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const [openCreatePageGroup, setOpenCreatePageGroup] = useState(false);

  const [fetchPageGroups, setFetchPageGroup] = useState([]);
  const [fetchPage, setFetchPage] = useState([]);
  const [documentationData, setDocumentationData] = useState([]);
  const [refreshPage, setRefreshpage] = useState(false);
  const [smallestId, setSmallestId] = useState([]);

  const handleRefresh = () => {
    setRefreshpage(!refreshPage);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responsePageGroups = await instance.get('/docs/page-groups');
        setFetchPageGroup(responsePageGroups?.data || []);
        const responsePages = await instance.get('/docs/pages');
        setFetchPage(responsePages?.data || []);
      } catch (err) {
        if (!err.response) {
          navigate('/server-down');
          return;
        }
        console.error(err);
        toastMessage(err?.response?.data?.message, 'error');
      }
    };

    fetchData();
  }, [user, refreshPage, refresh, navigate]);

  useEffect(() => {
    const combineData = () => {
      let filteredGroups = [];
      let filteredPages = [];

      if (fetchPageGroups.length > 0 && fetchPage.length > 0) {
        filteredGroups = fetchPageGroups.filter((obj) => !obj.parentId);
        filteredPages = fetchPage.filter((obj) => !obj.pageGroupId);
      } else if (fetchPageGroups.length > 0) {
        filteredGroups = fetchPageGroups.filter((obj) => !obj.parentId);
      } else if (fetchPage.length > 0) {
        filteredPages = fetchPage.filter((obj) => !obj.pageGroupId);
      } else {
        return [];
      }

      const combinedPages = [...filteredGroups, ...filteredPages];

      combinedPages.sort((a, b) => {
        const orderA = a.order !== null ? a.order : Infinity;
        const orderB = b.order !== null ? b.order : Infinity;

        if (orderA !== orderB) {
          return orderA - orderB;
        } else {
          return combinedPages.indexOf(a) - combinedPages.indexOf(b);
        }
      });

      setDocumentationData(combinedPages);
    };

    combineData();
  }, [fetchPageGroups, fetchPage, refresh]);

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredItems = documentationData.filter(
    (obj) =>
      obj.documentationId === (docId ? Number(docId) : smallestId) &&
      (obj.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await instance.get('/docs/documentations');
        if (response?.status === 200) {
          const data = response.data;

          const smallestId = data.reduce(
            (min, doc) => (doc.id < min ? doc.id : min),
            data[0]?.id
          );
          setSmallestId(smallestId);
          if (docId) {
            const responseDoc = await instance.post('/docs/documentation', {
              id: Number(docId)
            });
            if (responseDoc?.status === 200) {
              setDocumentData(responseDoc.data);
              setLoading(false);
            }
          } else {
            const responseSmallest = await instance.post(
              '/docs/documentation',
              { id: smallestId }
            );
            if (responseSmallest?.status === 200) {
              setDocumentData(responseSmallest.data);
              setLoading(false);
            }
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
  }, [docId, refresh, navigate, user]);

  const handleDeletemodalopen = () => {
    setDeleteModal(true);
  };

  const handleCancel = () => {
    setDeleteModal(false);
  };

  // Documentation CRUD function
  const handleDelete = async () => {
    try {
      const response = await instance.post('docs/documentation/delete', {
        id: Number(docId)
      });
      if (response?.status === 200) {
        setDeleteModal(false);
        toastMessage(response?.data.message, 'success');
        refreshData();
        navigate('/dashboard');
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

  const handleEditClose = () => {
    setIsEditModal(!isEditModal);
  };

  const handelUpdate = async (editTitle, editDescription) => {
    try {
      const response = await instance.post('docs/documentation/edit', {
        id: Number(docId),
        name: editTitle,
        description: editDescription
      });

      if (response?.status === 200) {
        setIsEditModal(false);
        refreshData();
        toastMessage(response?.data.message, 'success');
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
        setIsPageGroupsDeleteModal(false);
        toastMessage(response?.data.message, 'success');
        navigate(`/dashboard/documentation?id=${docId}`);
        handleRefresh();
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
        refreshData();
        toastMessage(response?.data.message, 'success');
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

  const CreatePageGroupModalClose = () => {
    setOpenCreatePageGroup(false);
  };

  const handleCreatePageGroup = async (title) => {
    if (title === '') {
      toastMessage('Title is required. Please Enter PageGroup title', 'warn');
      return;
    }

    try {
      const response = await instance.post('docs/page-group/create', {
        name: title,
        documentationSiteId: Number(docId)
      });

      if (response?.status === 200) {
        setOpenCreatePageGroup(false);
        refreshData();
        toastMessage(response?.data.message, 'success');
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

    const newItems = Array.from(documentationData);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setDocumentationData(newItems);

    const updateOrder = async (item, index) => {
      try {
        const endpoint = item?.name
          ? '/docs/page-group/reorder'
          : '/docs/page/reorder';
        await instance.post(endpoint, {
          id: item.id,
          documentationId: docId,
          order: index
        });
      } catch (err) {
        if (!err.response) {
          toastMessage(err?.message, 'error');
          navigate('/server-down');
          return;
        }
        toastMessage(err?.response?.data?.message, 'error');
      }
    };

    // Use map instead of forEach to iterate asynchronously
    await Promise.all(newItems.map((item, index) => updateOrder(item, index)));
  };

  return (
    <AnimatePresence className='bg-gray-50 dark:bg-gray-900 p-3 sm:p-5'>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='flex pb-5'
        aria-label='Breadcrumb'
      >
        <ol className='inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse'>
          <li className='inline-flex items-center '>
            <Link to={`/dashboard/documentation?id=${docId}`}>
              <span className='inline-flex items-center gap-1 text-md  font-medium text-gray-500  dark:text-gray-400 cursor-text '>
                <Icon icon='material-symbols:home' className=' ' />
                {documentData.name}
              </span>
            </Link>
          </li>
        </ol>
      </motion.nav>

      {/* Create pageGroup resusable component */}
      {openCreatePageGroup && (
        <CreatePageGroup
          closeModal={CreatePageGroupModalClose}
          handleCreate={handleCreatePageGroup}
        />
      )}

      {/* Edit Documentation component */}
      {isEditModal && (
        <EditDocumentModal
          heading='Edit Documentation'
          value={documentData.id}
          docId={documentData.id}
          title={documentData.name}
          description={documentData.description}
          closeModal={handleEditClose}
          updateData={handelUpdate}
        />
      )}

      {/* Delete Documentation Component */}
      {isDeleteModal && (
        <DeleteModal
          cancelModal={handleCancel}
          deleteDoc={handleDelete}
          id={documentData.id}
          title='Are you sure?'
          message={`You're permanently deleting "${documentData.name}"`}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className=' lg:mt-0 lg:col-span-5 flex justify-end mr-5 gap-3'
      >
        <motion.button
          whilehover={{ scale: 1.3 }}
          onClick={() => setIsEditModal(!isEditModal)}
          title='Edit Documentation'
        >
          <Icon
            icon='material-symbols:edit-outline'
            className='w-6 h-6 text-yellow-500 dark:text-yellow-400'
          />
        </motion.button>

        <motion.button
          whilehover={{ scale: 1.3 }}
          onClick={handleDeletemodalopen}
          title='Delete Documentation'
        >
          <Icon
            icon='material-symbols:delete'
            className='w-6 h-6 text-red-600 dark:text-red-500'
          />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='grid max-w-screen-xl '
      >
        <div className='mr-auto place-self-center lg:col-span-7'>
          <h1 className='max-w-xl mb-4 text-4xl font-bold tracking-tight leading-none md:text-4xl xl:text-4xl dark:text-white'>
            {documentData.name}
          </h1>
          <p className='max-w-2xl mb-6 font-light text-gray-700 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400'>
            {documentData.description}
          </p>
        </div>
      </motion.div>

      {filteredItems && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.1 }}
          className=' '
        >
          <div className='bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden'>
            <div className='flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4'>
              <div className='w-full md:w-1/3'>
                <div className='flex items-center'>
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
                    />
                  </div>
                </div>
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

            {filteredItems && (
              <div className='overflow-x-auto '>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId='table' type='TABLE'>
                    {(provided) => (
                      <table className='w-full text-sm text-left text-gray-500 dark:text-gray-400'>
                        <thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
                          <tr>
                            <th />
                            <th scope='col' className='px-4 py-3'>
                              Title
                            </th>
                            <th
                              scope='col'
                              className='px-4 py-3 whitespace-nowrap'
                            >
                              Create / update
                            </th>
                            <th
                              scope='col'
                              className='px-4 py-3 whitespace-nowrap'
                            >
                              Author / Editor
                            </th>
                            <th scope='col' className='px-4 py-3'>
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {loading
                            ? (
                              <tr className='border-b dark:border-gray-700'>
                                <td colSpan='12' className='py-8'>
                                  <div className='flex flex-col items-center justify-center'>
                                    {loading && (
                                      <Icon
                                        icon='line-md:loading-twotone-loop'
                                        className='w-32 h-32'
                                      />
                                    )}
                                  </div>
                                </td>
                              </tr>
                              )
                            : !filteredItems === null ||
                            filteredItems.length <= 0
                                ? (
                                  <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className='border-b dark:bg-gray-700'
                                  >
                                    <td colSpan='12' className='text-center py-8'>
                                      <h1 className='text-center text-gray-600 sm:text-lg font-semibold'>
                                        No Pages Found
                                      </h1>
                                    </td>
                                  </motion.tr>
                                  )
                                : (
                                    filteredItems.map((obj, index) => (
                                      <Draggable
                                        key={`dragagable-${obj.id}-${index}`}
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
                                    } border dark:border-gray-700 h-16`}
                                            key={`${obj.id}-${index}`}
                                          >
                                            <th
                                              scope='row'
                                              className='items-center w-5 cursor-pointer gap-2 px-4 py-3 font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap dark:text-white '
                                            >
                                              <Icon
                                                icon='nimbus:drag-dots'
                                                className='w-6 h-6 text-gray-600 dark:text-white'
                                              />
                                            </th>

                                            <th
                                              scope='row'
                                              className={`${
                                        snapshot.isDragging
                                          ? 'text-black'
                                          : 'text-blue-600'
                                      }  cursor-pointer  px-4 py-3 font-medium  hover:text-blue-800 whitespace-nowrap dark:text-white`}
                                            >
                                              <Link
                                                className='flex items-center gap-1'
                                                to={
                                          obj.name
                                            ? `/dashboard/documentation/pagegroup?id=${docId}&pageGroupId=${obj.id}`
                                            : `/dashboard/documentation/edit-page?id=${docId}&dir=true&pageId=${obj.id}`
                                        }
                                              >
                                                {obj.name
                                                  ? (
                                                    <Icon icon='material-symbols:folder' className='text-yellow-400 dark:text-yellow-200 w-6 h-6' />
                                                    )
                                                  : (
                                                    <Icon icon='bx:file' className='w-6 h-6 text-gray-500 dark:text-white' />
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
                                                  data-dropdown-toggle={`dropdown123-${obj.id}`}
                                                  className='inline-flex items-center gap-3 p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100'
                                                  type='button'
                                                >
                                                  <Icon
                                                    icon='material-symbols:edit-outline' className='w-6 h-6 text-yellow-500 dark:text-yellow-400' onClick={() => {
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
                                    ))
                                  )}
                        </tbody>
                      </table>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}

            {/* PageGroup Edit Component */}
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
                title='Are you sure?'
                message={`You're permanently deleting "${currentItem.name}`}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
