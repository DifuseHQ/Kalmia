import { initFlowbite } from "flowbite";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../Context/AuthContext";
import instance from "../../api/AxiosInstance";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toastError, toastSuccess, toastWarning } from "../../utlis/toast";
import { AnimatePresence, motion } from "framer-motion";
import { Editor } from "primereact/editor";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function CreatepageModal() {
  const [searchParam] = useSearchParams();
  const doc_id = searchParam.get("id");
  const dir = searchParam.get("dir");
  const pagegroup_id = searchParam.get("pagegroup_id");
  const { refreshData } = useContext(AuthContext);

  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    initFlowbite();
  }, []);

  const handleCreate = async () => {
    if (title === "" || slug === "") {
      toastWarning("Title and Slug required");
    }

    if (dir === "true") {
      try {
        const response = await instance.post("docs/page/create", {
          title: title,
          slug: slug,
          content: content,
          documentationSiteId: Number(doc_id),
        });

        if (response?.status === 200) {
          refreshData();
          toastSuccess(response?.data?.message);
          navigate(`/dashboard/documentation?id=${doc_id}`);
        }
      } catch (err) {
        if (!err.response) {
          toastError(err?.message);
          navigate("/server-down");
        }
        toastError(err?.response?.data?.message);
      }
    } else if (dir === "false") {
      try {
        const response = await instance.post("docs/page/create", {
          title: title,
          slug: slug,
          content: content,
          documentationSiteId: Number(doc_id),
          pageGroupId: Number(pagegroup_id),
        });

        if (response?.status === 200) {
          refreshData();
          toastSuccess(response?.data?.message);
          navigate(
            `/dashboard/documentation/pagegroup?id=${doc_id}&pagegroup_id=${pagegroup_id}`
          );
        }
      } catch (err) {
        if (!err.response) {
          toastError(err?.message);
          navigate("/server-down");
        }
        toastError(err?.response?.data?.message);
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        className="flex mb-5"
        aria-label="Breadcrumb"
      >
        <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
          <li className="inline-flex items-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              <svg
                className="w-3 h-3 me-2.5"
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
            <div className="flex items-center">
              <svg
                className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
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
                className="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
              >
                Documentation
              </Link>
            </div>
          </li>
          {pagegroup_id && (
            <li aria-current="page">
              <div className="flex items-center">
                <svg
                  className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
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
                  to={`/dashboard/documentation/pagegroup?id=${doc_id}&pagegroup_id=${pagegroup_id}`}
                  className="ms-1 text-sm font-medium text-gray-800 md:ms-2 dark:text-gray-400"
                >
                  PageGroup
                </Link>
              </div>
            </li>
          )}
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
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
              <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">
                create page
              </span>
            </div>
          </li>
        </ol>
      </motion.nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        id="defaultModal"
        tabindex="-1"
        aria-hidden="true"
        className="flex justify-center items-center w-full md:inset-0 h-modal md:h-full"
      >
        <div className="flex justify-center  p-4 w-full  h-full md:h-auto">
          <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
            <div className="flex justify-center items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
              <h3 className="text-lg  font-semibold text-gray-900 dark:text-white">
                Create Page
              </h3>
              {/* <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                    <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    <span className="sr-only">Close modal</span>
                </button> */}
            </div>

            <div className="grid gap-4 mb-4 ">
              <div>
                <label
                  htmlForfor="title"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  name="title"
                  id="title"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="Page title"
                />
              </div>

              <div>
                <label
                  htmlForfor="slug"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Slug
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  name="slug"
                  id="slug"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="Page slug"
                />
              </div>

              <div className="">
                <label
                  for="content"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Content
                </label>
                <Editor
                  value={content}
                  onTextChange={(e) => setContent(e.htmlValue)}
                  style={{ minHeight: "150px" }}
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleCreate}
                type="submit"
                className="text-white inline-flex items-center bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              >
                <svg
                  className="mr-1 -ml-1 w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                Create Page
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
