import { Outlet } from "react-router-dom";

import Loading from "../components/Loading/Loading";
import Navbar from "../components/Navbar/Navbar";
import PageGroupListModal from "../components/PageGroupListModal/PageGroupListModal";
import Sidebar from "../components/Sidebar/Sidebar";
import GitBookModal from "../components/GitBookModal/GitBookModal";
import { ModalContext } from "../context/ModalContext";
import { useContext } from "react";

export default function DashboardPage() {
  const { gitBookModal } = useContext(ModalContext);

  return (
    <div className="antialiased bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <Loading />
      <Sidebar />
      <main className="p-4 md:ml-64 min-h-screen pt-20">
        <PageGroupListModal />
        {gitBookModal && <GitBookModal />}

        <Outlet />
      </main>
    </div>
  );
}
