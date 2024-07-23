import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { getFormattedDate } from '../../utils/Common';
import { AuthContext } from '../../context/AuthContext';

export default function Table ({ provided, snapshot, docId, pageGroupId, obj, index, openEditPageGroup }) {
  const { setCurrentItem, setDeleteModal, setEditModal, setDeleteItem } = useContext(AuthContext);
  return (
    <tr
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`${snapshot.isDragging
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
              ? `/dashboard/documentation/page-group?id=${docId}&pageGroupId=${obj.id}&groupName=${obj.name}`
              : `/dashboard/documentation/edit-page?id=${docId}&dir=false&pageGroupId=${pageGroupId}&pageId=${obj.id}&pageName=${obj.title}`
          }
        >
          {obj.name
            ? (
              <Icon
                icon='clarity:folder-solid'
                className='w-6 h-6'
              />
              )
            : (
              <Icon
                icon='iconoir:page'
                className='w-6 h-6 text-gray-500 dark:text-white'
              />
              )}

          {obj.name || obj.title}
        </Link>
      </th>

      <td className='px-4 py-3 cursor-text'>
        <div className='flex justify-start items-center gap-2'>
          <Icon
            icon='mdi:user'
            className='w-4 h-4 text-gray-500 dark:text-white'
          />
          <span className=' px-1 text-left items-center dark:text-white text-md whitespace-nowrap'>
            {obj.author.username}
          </span>
        </div>
        <div className='flex gap-2 items-center'>
          <Icon
            icon='mdi:edit-outline'
            className='w-4 h-4 text-gray-500 dark:text-white'
          />
          <span className=' px-1 text-left items-center dark:text-white text-md whitespace-nowrap'>
            {
              (obj.editors).filter((editor) => editor.id === obj.lastEditorId)[0]?.username || obj.editors[0]?.username
            }
          </span>
        </div>
      </td>

      <td className='px-4 py-3 cursor-text'>
        <div className='flex justify-start items-center gap-2' title='Creation Date'>
          <Icon
            icon='mdi:clock-plus-outline'
            className='w-4 h-4 text-gray-500 dark:text-white'
          />
          <span className=' px-1 text-left items-center dark:text-white text-md whitespace-nowrap'>
            {getFormattedDate(obj.createdAt)}
          </span>
        </div>
        <div
          className='flex gap-2 items-center'
          title='Last Update Date'
        >
          <Icon
            icon='mdi:clock-edit-outline'
            className='w-4 h-4 text-gray-500 dark:text-white'
          />
          <span className=' px-1 text-left items-center dark:text-white text-md whitespace-nowrap'>
            {getFormattedDate(obj.updatedAt)}
          </span>
        </div>
      </td>

      {obj.name
        ? (
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
                  setCurrentItem(obj);
                  setEditModal(true);
                }}
              />
              <Icon
                icon='material-symbols:delete'
                className='w-6 h-6 text-red-600 dark:text-red-500'
                onClick={() => {
                  setDeleteItem('pageGroup');
                  setCurrentItem(obj);
                  setDeleteModal(true);
                }}
              />
            </button>
          </td>
          )
        : (
          <td className='px-4 py-3 cursor-pointer relative'>
            <button
              id={`dropdown-button-${obj.id}`}
              data-dropdown-toggle={`dropdown-${obj.id}`}
              className='inline-flex items-center gap-2 p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100'
              type='button'
            >
              <Link to={`/dashboard/documentation/edit-page?id=${docId}&dir=false&pageGroupId=${pageGroupId}&pageId=${obj.id}&pageName=${obj.title}`}>
                <Icon
                  icon='material-symbols:edit-outline'
                  className='w-6 h-6 text-yellow-500 dark:text-yellow-400'
                />
              </Link>

              <Icon
                icon='material-symbols:delete'
                className='w-6 h-6 text-red-600 dark:text-red-500'
                onClick={() => {
                  setDeleteItem('page');
                  setCurrentItem(obj);
                  setDeleteModal(true);
                }}
              />
            </button>
          </td>

          )}
    </tr>
  );
}
