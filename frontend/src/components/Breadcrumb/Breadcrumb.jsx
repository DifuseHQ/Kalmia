import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react/dist/iconify.js';
import { getDocumentations, getPageGroups, getPages } from '../../api/Requests';
import { toastMessage } from '../../utils/Toast';

export default function Breadcrumb () {
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [searchParams] = useSearchParams();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function updateBreadcrumb () {
      const newBreadcrumb = [];

      if (location.pathname.includes('/dashboard/admin')) {
        newBreadcrumb.push({
          title: 'User Management',
          path: '/dashboard/admin/user-list',
          icon: 'mdi:users'
        });

        if (location.pathname.includes('/create-user')) {
          newBreadcrumb.push({
            title: 'Create User',
            path: '/dashboard/admin/create-user',
            icon: 'mdi:account-plus'
          });
        } else if (location.pathname.includes('/user-list')) {
          newBreadcrumb.push({
            title: 'User List',
            path: '/dashboard/admin/user-list',
            icon: 'mdi:table-user'
          });
        }

        setBreadcrumb(newBreadcrumb);
        return;
      }

      const [documentations, pageGroups, pages] = await Promise.all([
        getDocumentations(),
        getPageGroups(),
        getPages()
      ].map(async (promise) => {
        const result = await promise;
        if (result.status === 'error') {
          throw new Error(result.message);
        }
        return result.data;
      })).catch(error => {
        toastMessage('error', error.message);
        return [null, null, null];
      });

      newBreadcrumb.push({
        title: 'Dashboard',
        path: '/dashboard',
        icon: 'uiw:home'
      });

      const docId = searchParams.get('id');
      const pageId = searchParams.get('pageId');
      const pageGroupId = searchParams.get('pageGroupId');
      const isCreatePage = location.pathname.includes('/create-page');

      if (docId) {
        const doc = documentations.find(d => d.id === parseInt(docId));
        if (doc) {
          newBreadcrumb.push({
            title: doc.name,
            path: `/dashboard/documentation?id=${doc.id}`,
            icon: 'uiw:document'
          });
        }
      } else {
        const smallestId =await documentations.reduce((min, doc) => (doc.id < min ? doc.id : min), documentations[0]?.id);
        navigate(`/dashboard/documentation?id=${smallestId}`);
      }

      if (isCreatePage) {
        if (pageGroupId) {
          addPageGroupsBreadcrumb(parseInt(pageGroupId), pageGroups, newBreadcrumb);
        }
        newBreadcrumb.push({
          title: 'Create Page',
          path: location.pathname + location.search,
          icon: 'mdi:file-document-plus'
        });
      } else if (location.pathname.includes('/edit-page') && pageId) {
        const page = pages.find(p => p.id === parseInt(pageId));
        if (page) {
          if (page.pageGroupId != null && page.pageGroupId !== undefined) {
            addPageGroupsBreadcrumb(page.pageGroupId, pageGroups, newBreadcrumb);
          }
          newBreadcrumb.push({
            title: page.title,
            path: `/dashboard/documentation/edit-page?id=${page.documentationId}&pageId=${page.id}&pageName=${page.name}`,
            icon: 'iconoir:page'
          });
        }
      } else if (location.pathname.includes('/page-group') && pageGroupId) {
        addPageGroupsBreadcrumb(parseInt(pageGroupId), pageGroups, newBreadcrumb);
      }

      setBreadcrumb(newBreadcrumb);
    }

    function addPageGroupsBreadcrumb (pageGroupId, pageGroups, newBreadcrumb) {
      function findPageGroup (groups, id) {
        for (const group of groups) {
          if (group.id === id) return group;
          if (group.pageGroups) {
            const found = findPageGroup(group.pageGroups, id);
            if (found) return found;
          }
        }
        return null;
      }

      function buildBreadcrumb (group) {
        if (group.parentId) {
          const parent = findPageGroup(pageGroups, group.parentId);
          if (parent) buildBreadcrumb(parent);
        }
        newBreadcrumb.push({
          title: group.name,
          path: `/dashboard/documentation/page-group?id=${group.documentationId}&pageGroupId=${group.id}&groupName=${group.name}`,
          icon: 'clarity:folder-solid'
        });
      }

      const pageGroup = findPageGroup(pageGroups, pageGroupId);
      if (!pageGroup) {
        return;
      }

      buildBreadcrumb(pageGroup);
    }

    updateBreadcrumb();
  }, [location.search, navigate, location.pathname, searchParams]);

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='mb-5'
      aria-label='Breadcrumb'
      key='breadcrumb-fin'
    >
      <ol className='flex flex-wrap items-center gap-y-2'>
        {breadcrumb.map((crumb, index) => (
          <li key={index} className='flex items-center'>
            <Link
              to={crumb.path}
              className='flex items-center text-sm md:text-base font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white whitespace-nowrap py-1'
            >
              <Icon icon={crumb.icon} className='w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 flex-shrink-0' />
              <span className='truncate max-w-[150px] md:max-w-[200px]'>{crumb.title}</span>
            </Link>
            {index !== breadcrumb.length - 1 && (
              <Icon
                icon='mingcute:right-fill'
                className='text-gray-500 mx-1 md:mx-2 flex-shrink-0'
              />
            )}
          </li>
        ))}
      </ol>
    </motion.nav>
  );
}
