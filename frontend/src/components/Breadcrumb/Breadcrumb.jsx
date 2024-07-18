import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react/dist/iconify.js';
import instance from '../../api/AxiosInstance';

export default function Breadcrumb () {
  const { breadcrumb, setBreadcrumb } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const docId = searchParams.get('id');
  const pageGroupId = searchParams.get('pageGroupId');
  const documentName = searchParams.get('docName');
  const pageGroupName = searchParams.get('groupName');
  const pageName = searchParams.get('pageName');
  const location = useLocation();

  const dependencies = useMemo(() => [
    pageGroupId,
    pageGroupName,
    documentName,
    docId,
    pageName,
    location.pathname
  ], [pageGroupId, pageGroupName, documentName, docId, pageName, location.pathname]);

  useEffect(() => {
    const storedBreadcrumb = JSON.parse(window.localStorage.getItem('breadcrumb') || '[]');
    setBreadcrumb(storedBreadcrumb);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('breadcrumb', JSON.stringify(breadcrumb));
  }, [breadcrumb]);

  useEffect(() => {
    const fetchBreadcrumb = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let newCrumb = null;

        if (location.pathname === '/dashboard') {
          const response = await instance.get('/docs/documentations');
          if (response?.status === 200) {
            const data = response.data;
            const smallestId = data.reduce((min, doc) => (doc.id < min ? doc.id : min), data[0]?.id);
            const filteredItems = data.find((obj) => obj.id === smallestId);
            const title = filteredItems.name;
            const path = `/dashboard/documentation?id=${filteredItems.id}`;
            newCrumb = { title, path };
          }
        } else {
          const title = pageName || pageGroupName || documentName;
          const path = documentName
            ? `/dashboard/documentation?id=${docId}`
            : `/dashboard/documentation/pagegroup?id=${docId}&pageGroupId=${pageGroupId}`;
          newCrumb = { title, path };
        }

        if (newCrumb) {
          setBreadcrumb((prevTrail) => {
            const existingIndex = prevTrail.findIndex(
              (crumb) => crumb.title === newCrumb.title && crumb.path === newCrumb.path
            );
            if (existingIndex === -1) {
              return [...prevTrail, newCrumb];
            } else {
              return prevTrail.slice(0, existingIndex + 1);
            }
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBreadcrumb();
  }, dependencies);

  const handleNavigate = (index) => {
    setBreadcrumb((prevTrail) => prevTrail.slice(0, index + 1));
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='flex mb-5'
      aria-label='Breadcrumb'
    >
      <ol className='inline-flex flex-wrap items-center space-x-1 md:space-x-2 rtl:space-x-reverse'>
        <Icon icon='ep:document' className='w-5 h-5 pb-0.5 dark:text-white' />
        {breadcrumb
          .filter((crumb) => crumb.title !== null)
          .map((crumb, index) => (
            <li key={index}>
              <Link
                to={crumb.path}
                className='flex items-center '
                onClick={
                  crumb.title !== pageGroupName
                    ? () => handleNavigate(index)
                    : undefined
                }
              >
                <p
                  className={`text-lg font-medium dark:text-gray-400 dark:hover:text-white
                    ${
                      crumb.title === pageGroupName
                        ? 'text-gray-400 cursor-text'
                        : 'hover:text-blue-600 text-gray-700'
                    }
                  `}
                >
                  {crumb.title}
                </p>
                {index !== breadcrumb.length - 1 && (
                  <Icon
                    icon='mingcute:right-fill'
                    className='text-gray-500 mx-2'
                  />
                )}
              </Link>
            </li>
          ))}
      </ol>
    </motion.nav>
  );
}
