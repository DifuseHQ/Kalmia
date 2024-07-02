import { initFlowbite } from "flowbite";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../api/axios";
import { getTokenFromCookies } from "../../utlis/CookiesManagement";
import ClipLoader from "react-spinners/ClipLoader";
import { MdDelete, MdEdit } from "react-icons/md";
import EditDocumentModal from "../createDocumentModal/EditDocumentModal";
import { ExchangeContext } from "../../Context/ExchangeContext";
import DeleteModal from "../deleteModal/DeleteModal";
import { toastError, toastSuccess } from "../../utlis/toast";
import { FaFolderOpen, FaRegFileAlt } from "react-icons/fa";

export default function Documentation() {

  const token = getTokenFromCookies();
  const { refresh, refreshData } = useContext(ExchangeContext);
  const [searchParam] = useSearchParams();
  const doc_id = searchParam.get("id");

  const [loading, setLoading] = useState(true);

  const [documentData, setDocumentData] = useState([]);
  const [isEditModal, setIsEditModal] = useState(false);
  const [isDeleteModal, setDeleteModal] = useState(false);
  
  const [isEditpageGroup,setIsEditpageGroup] = useState(false);
  const [isPageGroupsDeleteModal,setIsPageGroupsDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const [currentPage, setCurrentPage] = useState(1); 

  const numPageGroups = documentData.pageGroups
    ? documentData.pageGroups.length
    : 0;
  const numPages = documentData.pages ? documentData.pages.length : 0;

  const itemsPerPage = 8; 
  const totalItems = numPageGroups + numPages; 
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const navigate = useNavigate();

  useEffect(() => {
    initFlowbite();
  }, [documentData, handlePageChange]);

  useEffect(() => {
    const fetchdata = async () => {
      setLoading(true)
      try {
        const { data, status } = await axios.post(
          `/docs/documentation`,
          { id: Number(doc_id) },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log(data);
        if (status === 200) {
          setDocumentData(data);
          setLoading(false)
        } else {
          console.error("Failed to fetch data:", status.statusText);
        }
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    fetchdata();
  
  }, [doc_id, token, refresh]);

  const handleDeletemodalopen = () => {
    setDeleteModal(true);
  };

  const handleCancel = () => {
    setDeleteModal(false);
  };

  const handleDelete = async () => {
    try {
      const {data, status } = await axios.post(
        "docs/documentation/delete",
        { id: Number(doc_id) },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (status === 200) {
        toastSuccess(data.message);
        refreshData();
        navigate("/dashboard");
      }
    } catch (err) {
      toastError(err.response.data.message);
    }
  };

  const handleEditClose = () => {
    setIsEditModal(!isEditModal);
  };

  const handelUpdate = async (editTitle, editDescription) => {
    try {
      const { data, status } = await axios.post(
        "docs/documentation/edit",
        {
          id: Number(doc_id),
          name: editTitle,
          description: editDescription,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (status === 200) {
        setIsEditModal(false);
        refreshData();
        toastSuccess(data.message);
      } else {
        console.log("Error found :", data.error);
      }
    } catch (err) {
      toastError(err.response.data.message);
    }
  };


  const openDeletePageGroups = (item) => {
    setCurrentItem(item);
    setIsPageGroupsDeleteModal(true);
  };

  const handleCancelPagegroupDelete = () => {
    setIsPageGroupsDeleteModal(false);
    setCurrentItem(null);
  };

  const handleDeletePageGroup = async(id) => {
    try {
      const { data, status } = await axios.post(
        "docs/page-group/delete",
        { id: Number(id) },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (status === 200) {
        toastSuccess(data.message);
        setIsPageGroupsDeleteModal(false);
        refreshData();
      }
    } catch (err) {
      toastError(err.response.data.message);
    }

  }

  const openEditPageGroup = (item) => {
    setCurrentItem(item);
    setIsEditpageGroup(true);
  };

  const handleEditPageGroupClose = () => {
    setIsEditpageGroup(false);
    setCurrentItem(null);
  };

const handelPageGroupUpdate = async(editTitle,editDescription,id) => {
  try {
    const { data, status } = await axios.post(
      "docs/page-group/edit",
      {
        id: Number(id),
        name: editTitle,
        documentationSiteId: Number(doc_id),
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (status === 200) {
      setIsEditpageGroup(false);
      refreshData();
      toastSuccess(data.message);
    } else {
      console.log("Error found :", data.error);
    }
  } catch (err) {
    toastError(err.response.data.message);
  }
}
  return (
    <section class="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5">
      {isEditModal && (
        <EditDocumentModal
          heading="Edit Documentation"
          value={documentData.id}
          doc_id={documentData.id}
          title={documentData.name}
          description={documentData.description}
          closeModal={handleEditClose}
          updateData={handelUpdate}
        />
      )}

      {isDeleteModal && (
        <DeleteModal
          cancelModal={handleCancel}
          deleteDoc={handleDelete}
          id={documentData.id}
          title={`Are you sure you want to delete this ${documentData.name} Documentation`}
          message="By deleting this documentation associated page groups and pages will also be permanently deleted."
        />
      )}

     
      <div class=" lg:mt-0 lg:col-span-5 flex justify-end mr-5 gap-3">
        {/* <button type="button" class="flex items-center justify-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800">Edit</button> */}
        <button onClick={() => setIsEditModal(!isEditModal)}>
          <MdEdit
            size={25}
            className="cursor-pointer hover:border dark:bg-gray-100 dark:rounded"
          />
        </button>

        <MdDelete
          onClick={handleDeletemodalopen}
          size={25}
          color="red"
          className="cursor-pointer hover:border dark:bg-gray-100 dark:rounded"
        />

        {/* <button type="button" class="flex items-center justify-center text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800">Delete</button> */}
      </div>
      <div class="grid max-w-screen-xl px-4 mx-auto lg:gap-8 xl:gap-0 lg:grid-cols-12">
        <div class="mr-auto place-self-center lg:col-span-7">
          <h1 class="max-w-xl mb-4 text-4xl font-bold tracking-tight leading-none md:text-4xl xl:text-4xl dark:text-white">
            {documentData.name}
          </h1>
          <p class="max-w-2xl mb-6 font-light text-gray-700 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">
            {documentData.description}
          </p>
        </div>
      </div>

      <div class="mx-auto max-w-screen-xl px-4 lg:px-12">
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
              <button
                type="button"
                class="flex items-center justify-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
              >
                New Group
              </button>
              <button
                type="button"
                class="flex items-center justify-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
              >
                New page
              </button>
              {/* <div class="flex items-center space-x-3 w-full md:w-auto">
                <button
                  id="actionsDropdownButton"
                  data-dropdown-toggle="actionsDropdown"
                  class="w-full md:w-auto flex items-center justify-center py-2 px-4 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                  type="button"
                >
                  <svg
                    class="-ml-1 mr-1.5 w-5 h-5"
                    fill="currentColor"
                    viewbox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      clip-rule="evenodd"
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    />
                  </svg>
                  Actions
                </button>
                <div
                  id="actionsDropdown"
                  class="hidden z-10 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600"
                >
                  <ul
                    class="py-1 text-sm text-gray-700 dark:text-gray-200"
                    aria-labelledby="actionsDropdownButton"
                  >
                    <li>
                      <a
                        href="#"
                        class="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      >
                        Edit
                      </a>
                    </li>
                  </ul>
                  <div class="py-1">
                    <a
                      href="#"
                      class="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                    >
                      Delete all
                    </a>
                  </div>
                </div> */}
              {/* <button id="filterDropdownButton" data-dropdown-toggle="filterDropdown" class="w-full md:w-auto flex items-center justify-center py-2 px-4 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700" type="button">
                            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="h-4 w-4 mr-2 text-gray-400" viewbox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
                            </svg>
                            Filter
                            <svg class="-mr-1 ml-1.5 w-5 h-5" fill="currentColor" viewbox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path clip-rule="evenodd" fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </button> */}
              {/* <div id="filterDropdown" class="z-10 hidden w-48 p-3 bg-white rounded-lg shadow dark:bg-gray-700">
                            <h6 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">Choose brand</h6>
                            <ul class="space-y-2 text-sm" aria-labelledby="filterDropdownButton">
                                <li class="flex items-center">
                                    <input id="apple" type="checkbox" value="" class="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                                    <label for="apple" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">Apple (56)</label>
                                </li>
                                <li class="flex items-center">
                                    <input id="fitbit" type="checkbox" value="" class="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                                    <label for="fitbit" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">Microsoft (16)</label>
                                </li>
                                <li class="flex items-center">
                                    <input id="razor" type="checkbox" value="" class="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                                    <label for="razor" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">Razor (49)</label>
                                </li>
                                <li class="flex items-center">
                                    <input id="nikon" type="checkbox" value="" class="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                                    <label for="nikon" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nikon (12)</label>
                                </li>
                                <li class="flex items-center">
                                    <input id="benq" type="checkbox" value="" class="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                                    <label for="benq" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">BenQ (74)</label>
                                </li>
                            </ul>
                        </div> */}
              {/* </div> */}
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
                {loading ? (
                  <tr className="border-b dark:border-gray-700">
                    <td colSpan="4" className="py-8">
                      <div className="flex flex-col items-center justify-center">
                        <ClipLoader
                          color="#666161"
                          loading={loading}
                          size={100}
                          aria-label="Loading Spinner"
                          data-testid="loader"
                        />
                        <h1 className="text-xl font-bold text-center text-gray-500 mt-4">
                          Loading....
                        </h1>
                      </div>
                    </td>
                  </tr>
                ) : !documentData.pageGroups ||
                  documentData.pageGroups.length <= 0 ? (
                  <tr className="border-b dark:border-gray-700">
                    <td colSpan="4" className="text-center py-8">
                      <h1 className="text-center text-gray-600 sm:text-lg font-semibold">
                        No Pages Found
                      </h1>
                    </td>
                  </tr>
                ) : (
                  <>
                    {documentData.pageGroups
                      .slice(startIdx, endIdx)
                      .map((obj, index) => (
                      
                  
                        <tr
                          className="border-b dark:border-gray-700"
                          key={index}
                        >  
                        
                        {isPageGroupsDeleteModal && (
                          <DeleteModal
                            cancelModal={handleCancelPagegroupDelete}
                            deleteDoc={()=>handleDeletePageGroup(obj.id)}
                            id={obj.id}
                            title={`Are you sure you want to delete this "${obj.name}"`}
                            message={`By deleting this PageGroup associated pages will also be permanently deleted.`}
                          />
                        )}

                          <th
                            scope="row"
                            className="flex items-center cursor-pointer gap-2 px-4 py-3 font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap dark:text-white"
                          >
                            <FaFolderOpen color="#dbc039" size={20} />
                            {obj.name}
                          </th>
                          <td className="px-4 py-3">/{obj.name}</td>
                          <td className="px-4 py-3">Folder</td>
                          <td className="px-4 py-3 flex items-center">
                            <button
                              id={`dropdown-button-${index}`}
                              data-dropdown-toggle={`dropdown-${index}`}
                              className="inline-flex items-center p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100"
                              type="button"
                            >
                              <svg
                                className="w-5 h-5"
                                aria-hidden="true"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                              </svg>
                            </button>
                            <div
                              id={`dropdown-${index}`}
                              className="hidden z-10 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600"
                            >
                              
                              <ul
                                className="py-1 text-sm text-gray-700 dark:text-gray-200"
                                aria-labelledby={`dropdown-button-${index}`}
                              >
                                <li>
                                  <p
                                    onClick={() => openEditPageGroup(obj)}
                                    className="block py-2 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                  >
                                    Edit
                                  </p>
                                </li>
                                <li>
                                  <p
                                     onClick={() => openDeletePageGroups(obj)}
                                    className="block py-2 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                  >
                                    Delete
                                  </p>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                        
                      ))}
                      
                    {documentData.pages
                      .slice(startIdx - numPageGroups, endIdx - numPageGroups)
                      .map((page, index) => (
                        <tr
                          className="border-b dark:border-gray-700"
                          key={index}
                        >
                          <th
                            scope="row"
                            className="flex items-center cursor-pointer gap-2 px-4 py-3 font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap dark:text-white"
                          >
                            <FaRegFileAlt color="#8A8888" size={20} />
                            {page.title}
                          </th>
                          <td className="px-4 py-3">/{documentData.name}</td>
                          <td className="px-4 py-3">.txt</td>
                        </tr>
                      ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {!documentData.pageGroups || documentData.pageGroups.length <= 0 ? null : (
            <nav
              className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4"
              aria-label="Table navigation"
            >
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                Showing
                <span className="font-semibold text-gray-900 dark:text-white mx-1">
                  {startIdx + 1}-{Math.min(endIdx, totalItems)}
                </span>
                of
                <span className="font-semibold text-gray-900 dark:text-white mx-1">
                  {totalItems}
                </span>
              </span>
              <ul className="inline-flex items-stretch -space-x-px">
                <li>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="w-5 h-5"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i}>
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
                    <span className="sr-only">Next</span>
                    <svg
                      className="w-5 h-5"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </li>
              </ul>
            </nav>
          )}


                      {isEditpageGroup && currentItem && (
                          <EditDocumentModal
                            heading="Rename Page Group"
                            title={currentItem.name}
                            id={currentItem.id}
                            closeModal={handleEditPageGroupClose}
                            updateData={handelPageGroupUpdate}
                          />
                        )}

      {isPageGroupsDeleteModal && currentItem && (
        <DeleteModal
          cancelModal={handleCancelPagegroupDelete}
          deleteDoc={handleDeletePageGroup}
          id={currentItem.id}
          title={`Are you sure you want to delete this "${currentItem.name}"`}
          message={`By deleting this PageGroup associated pages will also be permanently deleted.`}
        />
      )}
        </div>
      </div>
    </section>
  );
}
