import { Editor } from "primereact/editor";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getTokenFromCookies } from "../../utlis/CookiesManagement";
import axios from "../../api/axios";
import { toastError, toastSuccess, toastWarning } from "../../utlis/toast";
import DeleteModal from "../deleteModal/DeleteModal";
import { AnimatePresence , motion} from "framer-motion";

export default function EditPage() {
  const [searchParams] = useSearchParams();
  const doc_id = searchParams.get("id");
  const dir = searchParams.get("dir");
  const page_id = searchParams.get("page_id");
  const pagegroup_id = searchParams.get("pagegroup_id");
  const group_name = searchParams.get("group_name");

  const token = getTokenFromCookies();

  const navigate = useNavigate();
  const [pageData, setPageData] = useState({});
  const [isDelete, setIsDelete] = useState(false);

  const [tempPageData, setTempPageData] = useState({});

  const updateContent = (newContent, name) => {
    setPageData((prevPageData) => ({
      ...prevPageData,
      [name]: newContent,
    }));
  };

  const isDataChanged = () => {
    return (
      pageData.title !== tempPageData.title ||
      pageData.slug !== tempPageData.slug ||
      pageData.content !== tempPageData.content
    );
  };

  const isChanged = isDataChanged();
  useEffect(() => {
    const fetchdata = async () => {
      try {
        const { data, status } = await axios.post(
          `docs/page`,
          { id: Number(page_id) },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (status === 200) {
          setPageData(data);
          setTempPageData(data);
        } else {
          console.error("Failed to fetch data:", status.statusText);
        }
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    fetchdata();
  }, []);

  const handleEdit = async () => {
    if (
      pageData.title !== tempPageData.title ||
      pageData.slug !== tempPageData.slug ||
      pageData.content !== tempPageData.content
    ) {
      toastWarning("Are you sure you want to edit");
    }
    try {
      const { data, status } = await axios.post(
        "/docs/page/edit",
        {
          title: pageData.title,
          slug: pageData.slug,
          content: pageData.content,
          id: Number(page_id),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (status === 200) {
        toastSuccess(data.message);
        if (dir == "true") {
          navigate(`/dashboard/documentation?id=${doc_id}`);
        } else {
          navigate(
            `/dashboard/documentation/pagegroup?id=${doc_id}&pagegroup_id=${pagegroup_id}`
          );
        }
      } else {
        console.log("Error found :", data.error);
      }
    } catch (err) {
      toastError(err.response.data.message);
    }
  };

  const handleCloseDelete = () => {
    setIsDelete(false);
  };

  const handleDelete = async () => {
    try {
      const { data, status } = await axios.post(
        "docs/page/delete",
        {
          id: Number(page_id),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (status === 200) {
        toastSuccess(data.message);
        if (dir == "true") {
          navigate(`/dashboard/documentation?id=${doc_id}`);
        } else {
          navigate(
            `/dashboard/documentation/pagegroup?id=${doc_id}&pagegroup_id=${pagegroup_id}`
          );
        }
      } else {
        console.log("Error found :", data.error);
      }
    } catch (err) {
      toastError(err.response.data.message);
    }
  };

  return (
    <AnimatePresence>
      {isDelete && (
        <DeleteModal
          cancelModal={handleCloseDelete}
          deleteDoc={handleDelete}
          id={pageData.id}
          title={`Are you sure you want to delete this file "${pageData.title}"`}
          message={`By deleting this file it will be permanently deleted.`}
        />
      )}
      <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{delay:0.1}}
      className="flex mb-5" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
          <li class="inline-flex items-center">
            <a class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
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
            </a>
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
          {pagegroup_id && (
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
                <Link
                  to={`/dashboard/documentation/pagegroup?id=${doc_id}&pagegroup_id=${pagegroup_id}`}
                  class="ms-1 text-sm font-medium text-gray-800 md:ms-2 dark:text-gray-400"
                >
                  {group_name}
                </Link>
              </div>
            </li>
          )}
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
                Edit page
              </span>
            </div>
          </li>
        </ol>
      </motion.nav>

      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{delay:0.1}}
      class=" lg:mt-0 lg:col-span-5 flex justify-end mr-5 gap-3">
        <motion.button
        whileHover={{scale:1.1}}
          onClick={() => setIsDelete(!isDelete)}
          className="flex cursor-pointer items-center bg-red-600 rounded text-white px-2"
        >
          Delete
          <svg
            class="w-5 h-5 cursor-pointer  text-white dark:text-red-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
            />
          </svg>
        </motion.button>
      </motion.div>

      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{delay:0.1}}
        id="defaultModal"
        tabindex="-1"
        aria-hidden="true"
        class="flex justify-center items-center w-full md:inset-0 h-modal md:h-full"
      >
        <div class="flex justify-center  p-4 w-full  h-full md:h-auto">
          <div class="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
            <div class="flex justify-center items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
              <h3 class="text-lg  font-semibold text-gray-900 dark:text-white">
                Edit Page
              </h3>
              {/* <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                  <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                  <span class="sr-only">Close modal</span>
              </button> */}
            </div>

            <div class="grid gap-4 mb-4 ">
              <div>
                <label
                  htmlForfor="title"
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={pageData.title}
                  onChange={(e) => updateContent(e.target.value, e.target.name)}
                  name="title"
                  id="title"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="Page title"
                />
              </div>

              <div>
                <label
                  htmlForfor="slug"
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Slug
                </label>
                <input
                  type="text"
                  required
                  value={pageData.slug}
                  onChange={(e) => updateContent(e.target.value, e.target.name)}
                  name="slug"
                  id="slug"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="Page slug"
                />
              </div>

              <div class="">
                <label
                  for="content"
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Content
                </label>
                <Editor
                  value={pageData.content}
                  onTextChange={(e) => updateContent(e.htmlValue, "content")}
                  style={{ minHeight: "150px" }}
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                disabled={!isDataChanged()}
                onClick={handleEdit}
                type="submit"
                class={`text-white inline-flex items-center ${
                  isChanged
                    ? "bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                    : "bg-gray-500"
                }  focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center `}
              >
                Edit Page
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
