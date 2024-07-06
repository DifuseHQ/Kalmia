import React, { useContext, useEffect, useState } from "react";
import { ModalContext } from "../../App";
import {privateAxios} from "../../api/axios";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence , motion } from "framer-motion";
import { toastError } from "../../utlis/toast";
import { AuthContext } from "../../Context/AuthContext";

export default function Sidebar() {
  const [documentation, setDocumentation] = useState([]);
  const [openDropdowns, setOpenDropdowns] = useState([]);
  const { setIsOpenModal } = useContext(ModalContext);
  const { refresh } = useContext(AuthContext);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchdata = async () => {
      try {
      const res = await privateAxios.get("/docs/documentations");
      if (res.status === 200) {
        setDocumentation(res.data);
      } else {
        console.log("not get");
      }
    } catch (err) {
      
      if (!err?.response) {
        
       navigate('/server-down');
    } else if (err.response?.status === 400) {
      console.log(err.response.statusText);
      toastError(err.response.data.error);
    } else if (err.response?.status === 401) {

      console.log(err.response.statusText);
        toastError(err.response.data.error)
    } else {
      toastError('Login Failed');
    }
    // errRef.current.focus();  for screen reader
    }
    };
    fetchdata();
  }, [refresh,navigate]);

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
    <motion.aside initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} 
          transition={{delay:0.1}} 
      class="fixed top-0 left-0 z-40 w-64 h-screen pt-14 transition-transform -translate-x-full bg-white border-r border-gray-200 md:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
      aria-label="Sidenav"
      id="drawer-navigation"
    >
      <div class="overflow-y-auto py-5 px-3 h-full bg-white dark:bg-gray-800">
        <form action="#" method="GET" class="md:hidden mb-2">
          <label for="sidebar-search" class="sr-only">
            Search
          </label>
          <div class="relative">
            <div class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
              <svg
                class="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                ></path>
              </svg>
            </div>
            <input
              type="text"
              name="search"
              id="sidebar-search"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="Search"
            />
          </div>
        </form>
        <ul class="space-y-2">
          <li>
            <motion.button
            whileHover={{scale:1.05}}
              onClick={handleCreateDocument}
              class="inline-flex cursor-pointer items-center justify-center w-full py-2 px-5 my-5 text-md text-white font-medium  focus:outline-none bg-blue-600 rounded-lg border border-blue-300 hover:bg-blue-600 hover:text-white focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
            >
              Create Document
              <svg
                class="h-4 w-4 ml-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 12h14m-7 7V5"
                ></path>
              </svg>
            </motion.button>
          </li>
          {documentation && documentation.map((val ,index) => (
            <motion.li key={index}
            whileHover={{scale:1.08, originx:0}}
            >
              <Link to={`/dashboard/documentation?id=${val.id}`}>
                <button
                  type="button"
                  onClick={() => toggleDropdown(index)}
                  class="flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
                  aria-controls={`${val.name}`}
                >
                  <svg
                    aria-hidden="true"
                    class="flex-shrink-0 w-6 h-6 text-gray-400 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span class="flex-1 ml-3 text-left whitespace-nowrap">
                    {val.name}
                  </span>
                  {/* {val.pageGroup && (
                    <svg
                      aria-hidden="true"
                      class="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  )} */}
                </button>
              </Link>
              {/* <ul
                  id={`${val.name}`}
                  className={`${
                    openDropdowns[index] ? "block" : "hidden"
                  } py-2 space-y-2`}
                >
                  {val.pageGroup &&
                    val.pageGroup.map((item, subIndex) => (
                      <li key={subIndex}>
                        {item.subGroup ? (
                          <button
                            type="button"
                            onClick={() => subGroupToggleDropdown(index)}
                            class="flex items-center ml-1 p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                            aria-controls={`${item.version}`}
                            data-collapse-toggle={`${item.version}`}
                          >
                            <span class="flex-1 ml-3 text-left whitespace-nowrap">
                              {item.version}
                            </span>
                            {val.pageGroup && (
                              <svg
                                aria-hidden="true"
                                class="w-6 h-6"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clip-rule="evenodd"
                                ></path>
                              </svg>
                            )}
                          </button>
                        ) : (
                          <a
                            href="#"
                            className="flex items-center ml-4 p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                          >
                            {item.version}
                          </a>
                        )}
                       

                        {item.subGroup && (
                          <ul
                            className={`${
                              subGroupOpenDropdowns[index] ? "block" : "hidden"
                            } py-2 space-y-2`}
                          >
                            {item.subGroup.map((subItem, nestedIndex) => (
                              <li key={nestedIndex}>
                                <a
                                  href="#"
                                  className="flex items-center ml-10 p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                >
                                  {subItem.subVersion}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                
                </ul> */}
            </motion.li>
          ))}

        {documentation.length <= 0 &&
            <li
            whileHover={{scale:1.08, originx:0}}
            >
              
                <p
                  class="flex cursor-default items-center p-5 w-full text-base font-normal text-gray-600 rounded-lg transition duration-75 group "
              
                >
                  <span class="flex-1 ml-3 text-left whitespace-nowrap">
                 No documentations
                  </span>
                 
                </p>
              
            </li>
          }

        </ul>
        <ul class="pt-5 mt-5 space-y-2 border-t border-gray-200 dark:border-gray-700">
          <li>
            <button class="flex items-center p-2 text-base font-medium text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group">
              <svg
                aria-hidden="true"
                class="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span class="ml-3">User Management</span>
            </button>
          </li>
        </ul>
      </div>
    </motion.aside>
    </AnimatePresence>
  );
}
