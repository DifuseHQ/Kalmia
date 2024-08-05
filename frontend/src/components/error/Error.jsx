import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Error () {
  const navigate = useNavigate();
  const location = useLocation();

  const errorDetails = location.state?.errorDetails;

  const goBack = () => {
    navigate(-1);
  };

  return (
    <section className='bg-neutral-300 dark:bg-gray-900 h-screen flex items-center justify-center'>
      <div className=' py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6'>
        <div className='mx-auto max-w-screen-sm text-center'>
          <h1 className='mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl dark:text-white '>
            {errorDetails?.code >= 500 ? '500' : '404'}
          </h1>

          <p className='mb-4 text-3xl tracking-tight font-bold text-gray-600 md:text-4xl dark:text-white'>
          {errorDetails?.code >= 500 ? 'Internal Server Error' : 'Page not Found'}
          </p>
          <button
            onClick={goBack}
            className='inline-flex text-white bg-primary-600 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4'
          >
            {errorDetails?.code >= 500 ? 'Reload' : 'Back to previous page'}
          </button>
        </div>
      </div>
    </section>
  );
}
