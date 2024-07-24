import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import instance from '../../api/AxiosInstance';
import CreatePageGroup from '../CreatePageGroup/CreatePageGroup';
import EditDocumentModal from '../CreateDocumentModal/EditDocumentModal';
import DeleteModal from '../DeleteModal/DeleteModal';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import { toastMessage } from '../../utils/Toast';
import { handleError, sortGroupAndPage } from '../../utils/Common';
import {
  getPageGroup,
  createPageGroup,
  deletePageGroup,
  updatePageGroup,
  deletePage
} from '../../api/Requests';
import Table from '../Table/Table';
import { AuthContext } from '../../context/AuthContext';

export default function PageGroupTable () {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('id');
  const pageGroupId = searchParams.get('pageGroupId');
  const [groupDetail, setGroupDetail] = useState([]);
  const [data, setData] = useState([]);
  const {
    createPageGroupModal,
    setCreatePageGroupModal,
    deleteItem,
    deleteModal,
    setDeleteModal,
    currentItem,
    refresh,
    refreshData,
    editModal,
    setEditModal
  } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const result = await getPageGroup(Number(pageGroupId));

      if (handleError(result, navigate)) {
        return;
      }

      if (result.status === 'success') {
        setGroupDetail(result.data);
        const groupData = result.data.pageGroups;
        const pages = result.data.pages;

        const combineData = sortGroupAndPage(groupData || [], pages || []);
        setData(combineData);
      }
    };

    if(docId){
      fetchData();
    }
  }, [pageGroupId, navigate, refresh]);

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredItems = data.filter(
    (obj) =>
      (obj.parentId === Number(pageGroupId) ||
        obj.pageGroupId === Number(pageGroupId)) &&
      (obj.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreatePageGroup = async (title) => {
    if (title === '') {
      toastMessage(
        'Title is required. Please Enter PageGroup title',
        'warning'
      );
      return;
    }

    const result = await createPageGroup({
      name: title,
      documentationId: Number(docId),
      parentId: Number(pageGroupId)
    });

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === 'success') {
      setCreatePageGroupModal(false);
      refreshData();
      toastMessage(result.data.message, 'success');
    }
  };

  const handleDeletePageGroup = async (id, path) => {
    let result;

    if (path === 'pageGroup') {
      result = await deletePageGroup(Number(id));
    } else if (path === 'page') {
      result = await deletePage(Number(id));
    }

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === 'success') {
      toastMessage(result.data.message, 'success');
      setDeleteModal(false);
      refreshData();
    }
  };

  const handlePageGroupUpdate = async (editTitle, editDescription, id) => {
    const result = await updatePageGroup({
      id: Number(id),
      name: editTitle,
      documentationId: Number(docId),
      parentId: Number(pageGroupId)
    });

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === 'success') {
      setEditModal(false);
      refreshData();
      toastMessage(result.data.message, 'success');
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

    await Promise.all(newItems.map((item, index) => updateOrder(item, index)));
    refreshData();
  };

  return (
    <AnimatePresence className='bg-gray-50 dark:bg-gray-900 p-3 sm:p-5'>
      <Breadcrumb />

      {createPageGroupModal && (
        <CreatePageGroup
          handleCreate={handleCreatePageGroup}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='grid max-w-screen-xl'
        key='pageGroupName'
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
        key='pageGroupTable'
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
                onClick={() => setCreatePageGroupModal(true)}
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
                  to={`/dashboard/documentation/create-page?id=${docId}&dir=false&pageGroupId=${pageGroupId}`}
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

          <div className='overflow-x-auto h-auto'>
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
                          Author / Editor
                        </th>
                        <th scope='col' className='px-4 py-3'>
                          Create / Update
                        </th>
                        <th scope='col' className='px-4 py-3' />
                      </tr>
                    </thead>
                    <tbody {...provided.droppableProps} ref={provided.innerRef}>
                      {filteredItems.length <= 0 && (
                        <tr className='border-b dark:border-gray-700'>
                          <td colSpan='4' className='text-center p-8'>
                            <h1 className='text-center text-gray-600 sm:text-lg font-semibold'>
                              No Pages Found
                            </h1>
                          </td>
                        </tr>
                      )}

                      {filteredItems.map((obj, index) => (
                        <Draggable
                          key={
                            obj.name ? `pageGroup-${obj.id}` : `page-${obj.id}`
                          }
                          draggableId={
                            obj.name ? `pageGroup-${obj.id}` : `page-${obj.id}`
                          }
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Table
                              provided={provided}
                              snapshot={snapshot}
                              obj={obj}
                              index={index}
                              docId={docId}
                              pageGroupId={obj.id}
                            />
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

      {editModal && currentItem && (
        <EditDocumentModal
          heading='Rename Page Group'
          title={currentItem.name}
          id={currentItem.id}
          updateData={handlePageGroupUpdate}
        />
      )}

      {/* PageGroup delete Component */}
      {deleteModal && currentItem && (
        <DeleteModal
          deleteDoc={() => handleDeletePageGroup(currentItem.id, deleteItem)}
          id={currentItem.id}
          title='Are you sure? '
          message={`You're permanently deleting "${currentItem.name}"`}
        />
      )}
    </AnimatePresence>
  );
}
