import React, { useContext, useEffect, useState } from "react";
import { ModalContext } from "../../App";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toastError } from "../../utlis/toast";
import { AuthContext } from "../../Context/AuthContext";
import { v4 as uuidv4 } from 'uuid';
import instance from "../../Context/AxiosInstance";

export default function Sidebar() {
  const [documentation, setDocumentation] = useState([]);
  const [openDropdowns, setOpenDropdowns] = useState([]);
  const { setIsOpenModal } = useContext(ModalContext);
  const { refresh, userDetails } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await instance.get("/docs/documentations");
        if (res.status === 200) {
          setDocumentation(res.data);
        }
      } catch (err) {
        console.error(err);
        toastError(err.response.data.message)
      }
    };
    fetchdata();
  }, [refresh, navigate]);

  const toggleDropdown = (index) => {
    const updatedDropdowns = [...openDropdowns];
    updatedDropdowns[index] = !updatedDropdowns[index];
    setOpenDropdowns(updatedDropdowns);
  };

  const handleCreateDocument = () => {
    navigate("/dashboard/create-documentation");
    setIsOpenModal(true);
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        className="fixed top-0 left-0 z-40 w-64 h-screen pt-14 transition-transform -translate-x-full bg-white border-r border-gray-200 md:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
        aria-label="Sidenav"
        id="drawer-navigation"
      >
        <div className="overflow-y-auto py-5 px-3 h-full bg-white dark:bg-gray-800">
          <form action="#" method="GET" className="md:hidden mb-2">
            <label htmlFor="sidebar-search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-500 dark:text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                name="search"
                id="sidebar-search"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                placeholder="Search"
              />
            </div>
          </form>
          <ul className="space-y-2">
            <li>
              <motion.button
                whilehover={{ scale: 1.05 }}
                onClick={handleCreateDocument}
                className="inline-flex cursor-pointer items-center justify-center w-full py-2 px-5 my-5 text-md text-white font-medium  focus:outline-none bg-blue-600 rounded-lg border border-blue-300 hover:bg-blue-600 hover:text-white focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
              >
                Create Document
                <svg
                  className="h-4 w-4 ml-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 12h14m-7 7V5"
                  ></path>
                </svg>
              </motion.button>
            </li>
            {documentation &&
              documentation.map((val, index) => (
                <motion.li
                  key={uuidv4()}
                  whilehover={{ scale: 1.08, originx: 0 }}
                >
                  <Link to={`/dashboard/documentation?id=${val.id}`}>
                    <button
                      type="button"
                      onClick={() => toggleDropdown(index)}
                      className="flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
                      aria-controls={`${val.name}`}
                    >
                      <svg
                        aria-hidden="true"
                        className="flex-shrink-0 w-6 h-6 text-gray-400 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      <span className="flex-1 ml-3 text-left whitespace-nowrap">
                        {val.name}
                      </span>
                    </button>
                  </Link>
                </motion.li>
              ))}

            {documentation.length <= 0 && (
              <li whilehover={{ scale: 1.08, originx: 0 }}>
                <p className="flex cursor-default items-center p-5 w-full text-base font-normal text-gray-600 rounded-lg transition duration-75 group ">
                  <span className="flex-1 ml-3 text-left whitespace-nowrap">
                    No documentations
                  </span>
                </p>
              </li>
            )}
          </ul>

          {userDetails && userDetails.Admin && (
            <ul className="pt-5 mt-5 space-y-2 border-t border-gray-200 dark:border-gray-700">
              <li>
                <Link to={`/dashboard/admin/user-list`}>
                  <button
                    type="button"
                    className="flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
                    aria-controls={``}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0 w-6 h-6 text-gray-400 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                      shapeRendering="geometricPrecision"
                      textRendering="geometricPrecision"
                      imageRendering="optimizeQuality"
                      fillRule="evenodd"
                      clipRule="evenodd"
                      viewBox="0 0 512 283.4"
                    >
                      <path d="M417.22 240.9c15.67-1.72 29.89-9.47 35.23-23.8 41.62 26.61 59.55 9.73 59.55 66.3h-90.99c0-18.11-1.26-31.84-3.79-42.5zm-305.11 42.5c5.89-76.2 19.74-48.02 85.11-88.92 20.19 42.13 102.24 45.19 119.07 0 56.41 36.07 83.6 12.25 83.6 88.92H112.11zm100.52-92.24c-.87-1.13 2.28-8.89 3.02-10.14-8.54-7.6-15.28-15.27-16.72-31.05l-.92.02c-2.11-.02-4.15-.51-6.06-1.6-3.06-1.74-5.21-4.73-6.66-8.09-3.08-7.07-13.21-30.52 2.22-28.67-8.62-16.11 10.91-43.64-22.78-53.82 27.64-35.01 85.95-88.98 128.68-34.84 46.77 4.53 61.36 60.12 29.87 90.56 1.84.07 3.58.5 5.12 1.32 5.86 3.14 6.05 9.94 4.51 15.65-1.52 4.77-3.46 8-5.28 12.65-2.22 6.28-5.46 7.45-11.72 6.77-.32 15.53-7.49 23.15-17.15 32.26l2.64 8.95c-12.94 27.46-66.72 28.57-88.77.03zM0 283.4c4.34-56.23 12.43-36.12 60.67-66.3 6.28 13.11 20.68 21.09 36.16 23.44-2.53 9.96-4.3 22.89-5.66 40.13-.11.89-.17 1.8-.17 2.73H0zm72.04-68.75c-.65-.83 1.68-6.56 2.23-7.48-6.3-5.61-11.28-11.27-12.34-22.91l-.68.01c-1.56-.02-3.07-.38-4.48-1.18-2.25-1.28-3.84-3.49-4.91-5.97-2.27-5.21-9.74-22.52 1.64-21.15-6.36-11.89 8.05-32.21-16.81-39.72 20.4-25.83 63.42-65.65 94.95-25.71 34.52 3.35 45.28 44.37 22.04 66.83 1.36.05 2.65.36 3.78.97 4.32 2.32 4.47 7.34 3.33 11.55-1.12 3.52-2.55 5.9-3.89 9.34-1.64 4.63-4.03 5.49-8.66 4.99-.1 5.32-1.3 9.38-3.27 12.87l-2.96 1.17c-21.79 8.53-34.18 13.39-41.66 31.45-10.92-1.42-21.61-6.38-28.31-15.06zm297.1-18.3c-1.67-3.25-2.84-7.13-3.29-12.09l-.68.01c-1.56-.02-3.07-.38-4.47-1.18-2.26-1.28-3.85-3.49-4.92-5.97-2.27-5.21-9.74-22.52 1.65-21.15-6.37-11.89 8.04-32.21-16.82-39.72 20.4-25.83 63.42-65.65 94.96-25.71 34.51 3.35 45.28 44.37 22.04 66.83 1.36.05 2.64.36 3.78.97 4.32 2.32 4.46 7.34 3.32 11.55-1.12 3.52-2.55 5.9-3.89 9.34-1.64 4.63-4.03 5.49-8.65 4.99-.24 11.46-5.53 17.08-12.66 23.81l1.95 6.6c-4.46 9.47-15.51 14.69-27.67 15.42-8.04-19.6-22.85-25.57-44.65-33.7z" />
                    </svg>
                    <span className="flex-1 ml-3 text-left whitespace-nowrap">
                      User Management
                    </span>
                  </button>
                </Link>
              </li>
            </ul>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
