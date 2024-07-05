import React, { useEffect, useState } from "react";
import { getTheme } from "../../utlis/getTheme";
import { Link, NavLink, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { getTokenFromCookies, removeCookies } from "../../utlis/CookiesManagement";
import { toastError, toastSuccess } from "../../utlis/toast";
import {motion, AnimatePresence} from 'framer-motion'

export default function Navbar() {
  const themeMode = getTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const navigate = useNavigate();


  useEffect(() => {
    getTheme();
    setIsDarkMode(themeMode === "dark");
  }, [themeMode]);

  const token = getTokenFromCookies();
  const handleDarkModeToggle = () => {
    const newMode = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", newMode);
    getTheme(newMode);
  };

  const handleLogout = async() =>{

    try {
      const {data, status} = await axios.post(
        "/auth/jwt/revoke",
        {
          token:token
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (status === 200) {
        removeCookies();
        toastSuccess(data.message); 
        navigate('/');
      } 

    } catch (err) {
      console.log(err);
        if (!err?.response) {
          toastError('No Server Response');
      } else if (err.response?.status === 400) {
        console.log("400");
        console.log(err.response.statusText);
           toastError(err.response.data.error);
      } else if (err.response?.status === 401) {
        console.log(err.response.data.message);
           toastError(err.response.data.message)
      } else {
           toastError(err.response.data.message);
      }
      
    }
    

  }

  return (
    <AnimatePresence>
    <motion.nav initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} 
           class="bg-white border-b border-gray-200 px-4 py-2.5 dark:bg-gray-800 dark:border-gray-700 fixed left-0 right-0 top-0 z-50">
      <div class="flex flex-wrap justify-between items-center">
        <div class="flex justify-start items-center">
          <NavLink to="/dashboard">
            <h1 className="text-blue-500 font-bold hidden sm:block">CMS</h1>
          </NavLink>
          <button
            data-drawer-target="drawer-navigation"
            data-drawer-toggle="drawer-navigation"
            aria-controls="drawer-navigation"
            class="p-2 mr-2 text-gray-600 rounded-lg cursor-pointer md:hidden hover:text-gray-900 hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <svg
              aria-hidden="true"
              class="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <svg
              aria-hidden="true"
              class="hidden w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <span class="sr-only">Toggle sidebar</span>
          </button>
        </div>

        <div class="flex items-center lg:order-2">
          <div className="flex" onClick={handleDarkModeToggle}>
            {isDarkMode ? (
              <button
                className="flex items-center justify-center p-2 text-xs w-9 h-9 font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 dark:bg-gray-800 focus:outline-none dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                onClick={handleDarkModeToggle}
              >
                <svg
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 18 20"
                >
                  <path d="M17.8 13.75a1 1 0 0 0-.859-.5A7.488 7.488 0 0 1 10.52 2a1 1 0 0 0 0-.969A1.035 1.035 0 0 0 9.687.5h-.113a9.5 9.5 0 1 0 8.222 14.247 1 1 0 0 0 .004-.997Z"></path>
                </svg>
              </button>
            ) : (
              <button
                className="flex items-center justify-center p-2 text-xs w-9 h-9 font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 dark:bg-gray-800 focus:outline-none dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                onClick={handleDarkModeToggle}
              >
                <svg
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-11a1 1 0 0 0 1-1V1a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1Zm0 12a1 1 0 0 0-1 1v2a1 1 0 1 0 2 0v-2a1 1 0 0 0-1-1ZM4.343 5.757a1 1 0 0 0 1.414-1.414L4.343 2.929a1 1 0 0 0-1.414 1.414l1.414 1.414Zm11.314 8.486a1 1 0 0 0-1.414 1.414l1.414 1.414a1 1 0 0 0 1.414-1.414l-1.414-1.414ZM4 10a1 1 0 0 0-1-1H1a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1Zm15-1h-2a1 1 0 1 0 0 2h2a1 1 0 0 0 0-2ZM4.343 14.243l-1.414 1.414a1 1 0 1 0 1.414 1.414l1.414-1.414a1 1 0 0 0-1.414-1.414ZM14.95 6.05a1 1 0 0 0 .707-.293l1.414-1.414a1 1 0 1 0-1.414-1.414l-1.414 1.414a1 1 0 0 0 .707 1.707Z"></path>
                </svg>
              </button>
            )}
          </div>

          <button
            type="button"
            class="flex mx-3 text-sm bg-gray-800 rounded-full md:mr-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
            id="user-menu-button"
            aria-expanded="false"
            data-dropdown-toggle="dropdown"
          >
            <span class="sr-only">Open user menu</span>
            <img
              class="w-8 h-8 rounded-full"
              src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/michael-gough.png"
              alt="user"
            />
          </button>

          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} 
            class="hidden z-50 my-4 w-56 text-base list-none bg-white  divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600 rounded-xl"
            id="dropdown"
          >
            <div class="py-3 px-4 hover:bg-gray-300 cursor-pointer">
              <span class="block text-sm font-semibold text-gray-900 dark:text-white">
                Neil Sims
              </span>
              <span class="block text-sm text-gray-900 truncate dark:text-white">
                name@flowbite.com
              </span>
            </div>

            <ul
              class="py-1 text-gray-700 dark:text-gray-300"
              aria-labelledby="dropdown"
            >
              <li>
                <p
                  onClick={handleLogout}
                  class="block cursor-pointer py-2 px-4 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  Sign out
                </p>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </motion.nav>
    </AnimatePresence>
  );
}
