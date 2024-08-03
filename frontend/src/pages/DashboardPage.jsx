import React from 'react';
import { Outlet } from 'react-router-dom';

import Loading from '../components/Loading/Loading';
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';

export default function DashboardPage () {
  return (
    <div className='antialiased bg-gray-50 dark:bg-gray-900'>
      <Navbar />
      <Loading />
      <Sidebar />
      <main className='p-4 md:ml-64 min-h-screen pt-20'>
        <Outlet />
      </main>
    </div>
  );
}
