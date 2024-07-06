import React, { useEffect } from "react";
import Navbar from "../components/navbar/Navbar";
import { initFlowbite } from "flowbite";
import Sidebar from "../components/sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import CreateDocModal from "../components/createDocumentModal/CreateDocModal";

export default function DashboardPage() {
  useEffect(() => {
    initFlowbite();
  }, []);

  return (
    <div class="antialiased bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <Sidebar />
      <main class="p-4 md:ml-64 min-h-screen pt-20">
        <CreateDocModal />
        <Outlet />
      </main>
    </div>
  );
}
