import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AuthContext } from '../../context/AuthContext';

export default function Error500 () {
  const { refreshData } = useContext(AuthContext);

  const naviagte = useNavigate();
  const handleReload = () => {
    refreshData();
    naviagte('/');
  };
  return (
    <section
      style={{
        backgroundImage: 'url(\'/assets/server_down.jpg\')',
        backgroundPosition: 'center center',
        backgroundsSize: 'cover'
      }}
      className='min-h-screen flex justify-center items-center gap-10 px-10 bg-no-repeat bg-cover bg-center bg-blend-multiply'
    >
      <div className='m-10'>
        <div className='max-w-screen-sm text-center'>
          <h1 className='mb-4 text-7xl tracking-tight font-extrabold lg:text-7xl text-gray-900 dark:text-gray-900 text-left'>
            500 <span className='text-gray-900 lg:text-5xl'>Server Error</span>
          </h1>
          <p className='mb-4 text-3xl tracking-tight font-bold text-gray-700 md:text-3xl text-center'>
            Oops, something Went Wrong.
          </p>
          <button
            onClick={handleReload}
            className='inline-flex gap-2 items-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-semibold rounded-lg text-md px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4'
          >
            <Icon icon='mdi:reload' className='w-7 h-7' />
            Reload
          </button>
        </div>
      </div>
    </section>
  );
}
