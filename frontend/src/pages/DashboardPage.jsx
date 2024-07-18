import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import CreateDocModal from '../components/CreateDocumentModal/CreateDocModal';

export default function DashboardPage () {
  return (
    <div className='antialiased bg-gray-50 dark:bg-gray-900'>
      <Navbar />
      <Sidebar />
      <main className='p-4 md:ml-64 min-h-screen pt-20'>
        <CreateDocModal />
        <Outlet />
      </main>
    </div>
  );
}
