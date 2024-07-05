import { initFlowbite } from "flowbite";
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "../../api/axios";
import { getTokenFromCookies } from "../../utlis/CookiesManagement";
import { FaRegFileAlt } from "react-icons/fa";
import { AnimatePresence , motion } from "framer-motion";

export default function PageGrouptable() {
  const token = getTokenFromCookies();
  const [searchParams] = useSearchParams();
  const doc_id = searchParams.get("id");
  const pagegroup_id = searchParams.get("pagegroup_id");

  const [data, setData] = useState([]);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    initFlowbite();
  }, [doc_id,pagegroup_id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pageGroupResponse = await axios.post(
          "docs/page-group",
          { id: Number(pagegroup_id) },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (pageGroupResponse.status === 200) {
          setData(pageGroupResponse.data);
          console.log("Page group data:", pageGroupResponse.data);
        } else {
          console.error(
            "Failed to fetch page group data:",
            pageGroupResponse.statusText
          );
        }
      } catch (error) {
        console.error("Error fetching page group data:", error.message);
      }

      try {
        const pagesResponse = await axios.get("/docs/pages", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (pagesResponse.status === 200) {
          setPages(pagesResponse.data);
          console.log("Pages data:", pagesResponse.data);
        } else {
          console.error(
            "Failed to fetch pages data:",
            pagesResponse.statusText
          );
        }
      } catch (error) {
        console.error("Error fetching pages data:", error.message);
      }
    };

    if (pagegroup_id) {
      fetchData();
    }
  }, [doc_id, pagegroup_id, token]);

  const filteredPages = pages.filter(
    (page) => page.pageGroupId === Number(pagegroup_id)
  );


  return (
    <AnimatePresence class="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5">
      <motion.nav  initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} 
     
       className="flex mb-5" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
          <li class="inline-flex items-center">
            <Link
              to="/dashboard"
              class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              <svg
                class="w-3 h-3 me-2.5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
              </svg>
              Home
            </Link>
          </li>
          <li>
            <div class="flex items-center">
              <svg
                class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
              <Link
                to={`/dashboard/documentation?id=${doc_id}`}
                class="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
              >
                Documentation
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div class="flex items-center">
              <svg
                class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
              <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">
                {data.name}
              </span>
            </div>
          </li>
        </ol>
      </motion.nav>

      <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }} 
     
      class="grid max-w-screen-xl px-4 mx-auto lg:gap-8 xl:gap-0 lg:grid-cols-12">
        <div class="mr-auto place-self-center lg:col-span-7">
          <h1 class="max-w-xl mb-4 text-4xl font-bold tracking-tight leading-none md:text-4xl xl:text-4xl dark:text-white">
            {data.name}
          </h1>
          <p class="max-w-2xl mb- font-light text-gray-700 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400"></p>
        </div>
      </motion.div>

      <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }} 
       transition={{delay:0.1}}
      class="mx-auto max-w-screen-xl px-4 lg:px-12">
        <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
          <div class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4">
            <div class="w-full md:w-1/3">
              <form class="flex items-center">
                <label for="simple-search" class="sr-only">
                  Search
                </label>
                <div class="relative w-full">
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                      aria-hidden="true"
                      class="w-5 h-5 text-gray-500 dark:text-gray-400"
                      fill="currentColor"
                      viewbox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="simple-search"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Search"
                    required=""
                  />
                </div>
              </form>
            </div>
            <div class="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0">
              <motion.button
              whileHover={{scale:1.1}}
                type="button"
                class="flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
              >
                Create Group
              </motion.button>
              <motion.button whileHover={{scale:1.1}}>
              <Link 
               to={`/dashboard/documentation/create-page?id=${doc_id}&dir=false&pagegroup_id=${pagegroup_id}`}
               class="flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
              >
                Create page
              </Link>
              </motion.button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" class="px-4 py-3">
                    Title
                  </th>
                  <th scope="col" class="px-4 py-3">
                    Path
                  </th>
                  <th scope="col" class="px-4 py-3">
                    Extension
                  </th>
                  <th scope="col" class="px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.length <= 0 && (
                  <tr className="border-b dark:border-gray-700">
                    <td colSpan="4" className="text-center py-8">
                      <h1 className="text-center text-gray-600 sm:text-lg font-semibold">
                        No Pages Found
                      </h1>
                    </td>
                  </tr>
                )}

                {filteredPages.map((obj, index) => (
                  <tr 
                  
                  class="border-b dark:border-gray-700 hover:bg-gray-200" key={index} >
                    <th
                      scope="row"
                      class=" flex items-center cursor-pointer px-4 py-3 gap-2 font-medium text-blue-500 hover:text-blue-700 whitespace-nowrap dark:text-white"
                    >
                      <Link className="flex"
                      to={`/dashboard/documentation/edit-page?id=${doc_id}&dir=false&pagegroup_id=${pagegroup_id}&page_id=${obj.id}&group_name=${data.name}`}>
                      <svg class="w-6 h-6 text-gray-600 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 3v4a1 1 0 0 1-1 1H5m4 8h6m-6-4h6m4-8v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z"/>
                      </svg>
                      {obj.title}
                      </Link>
                    </th>
                    <td class="px-4 py-3 ">/{obj.slug}</td>
                    <td class="px-4 py-3">.txt</td>
                    {/* <td class="px-4 py-3 flex items-center ">
                      <button
                        id={index}
                        data-dropdown-toggle={index}
                        class="inline-flex items-center p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100"
                        type="button"
                      >
                        <svg
                          class="w-5 h-5"
                          aria-hidden="true"
                          fill="currentColor"
                          viewbox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                      </button>
                      <div
                        id={index}
                        class="hidden z-10 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600"
                      >
                        <ul
                          class="py-1 text-sm text-gray-700 dark:text-gray-200"
                          aria-labelledby={index}
                        >
                          <li>
                            <a
                              href="#"
                              class="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                            >
                              Show
                            </a>
                          </li>
                          <li>
                            <a
                              href="#"
                              class="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                            >
                              Edit
                            </a>
                          </li>
                        </ul>
                      </div>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
