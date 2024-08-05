import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';

export default function Error () {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const errorDetails = location.state?.errorDetails;

  useEffect(() => {
    document.title = errorDetails?.code >= 500 ? 'Kalmia - Internal Server Error' : 'Kalima - 404 Page not found';
  }, []); //eslint-disable-line

  const goBack = () => {
    navigate(-1);
  };

  return (
    <section className='bg-neutral-300 dark:bg-gray-900 h-screen flex items-center justify-center'>
      <div className=' py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6'>
        <div className='mx-auto max-w-screen-sm text-center'>
          <div className='flex justify-center'>
          {errorDetails?.code >= 500 ? (
            <Icon icon="clarity:rack-server-outline-alerted" className='text-gray-500 w-32 h-32'/>
          ) : (
            <Icon icon="formkit:sad" className='text-gray-500 w-32 h-32'/>
          )}
          </div>
          <h1 className='mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl dark:text-white '>
            {errorDetails?.code >= 500 ? '500' : '404'}
          </h1>

          <p className='mb-4 text-3xl tracking-tight font-bold text-gray-600 md:text-4xl dark:text-white'>
          {errorDetails?.code >= 500 ? t('internal_server_error') : t('page_not_found')}
          </p>
          <button
            onClick={goBack}
            className='inline-flex text-lg text-white bg-primary-600 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4'
          >
            {errorDetails?.code >= 500 ? t('reload') : t('back_to_previous_page')}
          </button>
        </div>
      </div>
    </section>
  );
}
