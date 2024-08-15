import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { deleteUser, getUsers } from "../../api/Requests";
import { AuthContext, AuthContextType } from "../../context/AuthContext";
import { ModalContext } from "../../context/ModalContext";
import { User } from "../../types";
import { DOMEvent } from "../../types/dom";
import { getFormattedDate, handleError } from "../../utils/Common";
import { toastMessage } from "../../utils/Toast";
import Breadcrumb from "../Breadcrumb/Breadcrumb";
import DeleteModal from "../DeleteModal/DeleteModal";

export default function UserList() {
  const { t } = useTranslation();
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const navigate = useNavigate();
  const authcontext = useContext(AuthContext);
  const { refresh, refreshData } = authcontext as AuthContextType;
  const { openModal, closeModal, deleteModal, currentModalItem } =
    useContext(ModalContext);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const response = await getUsers();

      if (handleError(response, navigate, t)) {
        setLoading(false);
        return;
      }

      if (response?.status === "success") {
        setUserList(response?.data || []);
        setLoading(false);
      }
    };
    fetchData();
  }, [refresh, navigate]);

  const filterUser = (userList as User[]).filter(
    (user) =>
      !user.admin &&
      (user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  console.log("fil", filterUser);

  const handleSearchChange = (e: DOMEvent) => {
    const target = e.target as HTMLInputElement;
    setSearchTerm(target.value);
    setCurrentPage(1);
  };

  const handleDeleteUser = async (username: string | null) => {
    if (!username) {
      toastMessage(t("something_went_wrong_try_again"), "error");
      return;
    }

    const response = await deleteUser(username.toString());

    if (handleError(response, navigate, t)) return;

    if (response?.status === "success") {
      refreshData();
      toastMessage(t("user_deleted_successfully"), "success");
      closeModal("delete");
      navigate("/dashboard/admin/user-list");
    }
  };

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const totalItems = filterUser.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = useCallback(
    (pageNumber: number) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
      }
    },
    [totalPages],
  );

  const renderTableContent = () => {
    if (loading) {
      return (
        <tr className="border-b dark:border-gray-700" key="loading">
          <td colSpan={4} className="p-8">
            <div className="flex flex-col items-center justify-center">
              {loading && (
                <Icon
                  icon="line-md:loading-twotone-loop"
                  className="w-32 h-32"
                />
              )}
            </div>
          </td>
        </tr>
      );
    } else if (!filterUser || filterUser.length <= 0) {
      return (
        <motion.tr
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="border-b dark:border-gray-700"
        >
          <td colSpan={4} className="text-center p-8">
            <h1 className="text-center text-gray-600 sm:text-lg font-semibold">
              {t("no_user_found")}
            </h1>
          </td>
        </motion.tr>
      );
    } else {
      return (
        <>
          {filterUser.slice(startIdx, endIdx).map((user) => (
            <motion.tr className="border-b dark:border-gray-700" key={user.id}>
              <th
                scope="row"
                className="px-4 py-3 text-md font-medium text-black whitespace-nowrap dark:text-white"
              >
                {user.username}
              </th>
              <td className="px-4 py-3 text-md text-black dark:text-white">
                {user.email}
              </td>
              <td className="px-4 py-3 cursor-text">
                <div
                  className="flex justify-start items-center gap-2"
                  title="Creation Date"
                >
                  <Icon
                    icon="mdi:clock-plus-outline"
                    className="w-4 h-4 text-gray-500 dark:text-white"
                  />
                  <span className=" px-1 text-left items-center dark:text-white text-md whitespace-nowrap">
                    {getFormattedDate(user.createdAt)}
                  </span>
                </div>
                <div
                  className="flex gap-2 items-center"
                  title="Last Update Date"
                >
                  <Icon
                    icon="mdi:clock-edit-outline"
                    className="w-4 h-4 text-gray-500 dark:text-white"
                  />
                  <span className=" px-1 text-left items-center dark:text-white text-md whitespace-nowrap">
                    {getFormattedDate(user.updatedAt)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 cursor-pointer relative">
                <div className="inline-flex items-center gap-2 p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100">
                  <Link to={`/dashboard/admin/edit-user/${user.id}`}>
                    <Icon
                      icon="material-symbols:edit-outline"
                      className="w-6 h-6 text-yellow-500 dark:text-yellow-400"
                    />
                  </Link>
                  <Icon
                    icon="material-symbols:delete"
                    className="w-6 h-6 text-red-600 dark:text-red-500"
                    onClick={() => openModal("delete", user)}
                  />
                </div>
              </td>
            </motion.tr>
          ))}
        </>
      );
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-1 sm:p-1">
      <AnimatePresence>
        <Breadcrumb />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mx-auto justify-start"
          key="user-list"
        >
          <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4">
              <div className="w-full md:w-1/2">
                <form className="flex items-center">
                  <label htmlFor="simple-search" className="sr-only">
                    {t("search_placeholder")}
                  </label>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Icon
                        icon="material-symbols:search"
                        className="w-6 h-6 text-gray-400 dark:text-gray-500"
                      />
                    </div>
                    <input
                      type="text"
                      id="simple-search"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder={t("search_placeholder")}
                    />
                  </div>
                </form>
              </div>

              <button className="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0">
                <Link
                  to="/dashboard/admin/create-user"
                  className="flex text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                >
                  <span className=" px-1 pt-0.5 text-left items-center dark:text-white text-md">
                    {t("add_user")}
                  </span>
                  <Icon icon="ei:plus" className="w-6 h-6 dark:text-white" />
                </Link>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr key="header">
                    <th scope="col" className="px-4 py-3">
                      {t("username")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("email")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("create_update")}
                    </th>
                    <th scope="col" className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>{renderTableContent()}</tbody>
              </table>
            </div>

            {filterUser && filterUser.length > 0 && (
              <nav
                className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4"
                aria-label="Table navigation"
              >
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  {t("showing")}
                  <span className="font-semibold text-gray-900 dark:text-white mx-1">
                    {startIdx + 1}-{Math.min(endIdx, totalItems)}
                  </span>{" "}
                  {t("of")}
                  <span className="font-semibold text-gray-900 dark:text-white mx-1">
                    {totalItems}
                  </span>{" "}
                  {t("users")}
                </span>
                <ul className="inline-flex items-stretch -space-x-px">
                  <li>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      <span className="sr-only">Previous</span>
                      <Icon icon="mingcute:left-fill" />
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={"page-" + i}>
                      <button
                        onClick={() => handlePageChange(i + 1)}
                        className={`flex items-center justify-center text-sm py-2 px-3 leading-tight ${
                          currentPage === i + 1
                            ? "text-primary-600 bg-primary-50 border border-primary-300 hover:bg-primary-100 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                            : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                        }`}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      <Icon icon="mingcute:right-fill" />
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>

          {deleteModal && currentModalItem && (
            <DeleteModal
              deleteDoc={() =>
                handleDeleteUser(currentModalItem?.username || null)
              }
              id={currentModalItem.id}
              message={currentModalItem.username}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
