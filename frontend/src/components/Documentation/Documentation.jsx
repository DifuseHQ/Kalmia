import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Icon } from "@iconify/react";
import { AuthContext } from "../../context/AuthContext";
import instance from "../../api/AxiosInstance";
import EditDocumentModal from "../CreateDocumentModal/EditDocumentModal";
import DeleteModal from "../DeleteModal/DeleteModal";
import CreatePageGroup from "../CreatePageGroup/CreatePageGroup";
import { toastMessage } from "../../utils/Toast";
import Breadcrumb from "../Breadcrumb/Breadcrumb";
import { combinePages, handleError } from "../../utils/Common";
import Cookies from 'js-cookie'
import {
  getPageGroups,
  getPages,
  getDocumentations,
  getDocumentation,
  deleteDocumentation,
  updateDocumentation,
  deletePageGroup,
  updatePageGroup,
  createPageGroup,
  deletePage,
} from "../../api/Requests";
import Table from "../Table/Table";

export default function Documentation() {
  const navigate = useNavigate();
  const {
    refresh,
    refreshData,
    user,
    createPageGroupModal,
    setCreatePageGroupModal,
    deleteModal,
    setDeleteModal,
    deleteItem,
    currentItem,
    setCurrentItem,
    editModal,
    setEditModal,
  } = useContext(AuthContext);
  const [searchParam] = useSearchParams();
  const docId = searchParam.get("id");

  const [loading, setLoading] = useState(false);

  // Documentation CRUD
  const [documentData, setDocumentData] = useState([]);

  // pageGroup CRUD
  const [documentationData, setDocumentationData] = useState([]);
  const [smallestId, setSmallestId] = useState([]);

const token = Cookies.get('accessToken')
const par = JSON.parse(token)
console.log(par.token); 

  useEffect(() => {
    const fetchData = async () => {
      const documentationsResult = await getDocumentations();

      if (handleError(documentationsResult, navigate)) {
        return;
      }

      if (documentationsResult.status === "success") {
        const data = documentationsResult.data;
        console.log("data",data);
        const clonedData = data.filter((obj)=>obj.clonedFrom === Number(docId))
        console.log("clone" , clonedData);
        const smallestId = data.reduce(
          (min, doc) => (doc.id < min ? doc.id : min),
          data[0]?.id
        );
        setSmallestId(smallestId);

        const idToFetch = docId ? Number(docId) : smallestId;
        console.log("doc", docId);
       
        const documentationResult = await getDocumentation(Number(idToFetch));
        if (handleError(documentationResult, navigate)) {
          return;
        }
        console.log(documentationResult.data);
        if (documentationResult.status === "success") {
          setDocumentData(documentationResult.data);
          setLoading(false);
        }
      } 
    };

    fetchData();
  }, [docId, refresh, user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const [pageGroupsResult, pagesResult] = await Promise.all([
        getPageGroups(),
        getPages(),
      ]);

      handleError(pageGroupsResult, navigate);
      handleError(pagesResult, navigate);

      if (
        pageGroupsResult.status === "success" &&
        pagesResult.status === "success"
      ) {
        const combinedData = combinePages(
          pageGroupsResult.data || [],
          pagesResult.data || []
        );
        setDocumentationData(combinedData);
      }
    };

    fetchData();
  }, [user, navigate, refresh]);

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredItems = documentationData.filter(
    (obj) =>
      obj.documentationId === (docId ? Number(docId) : smallestId) &&
      (obj.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async () => {
    const result = await deleteDocumentation(Number(docId));

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === "success") {
      setDeleteModal(false);
      toastMessage(result.data.message, "success");
      refreshData();
      navigate("/dashboard");
    }
  };

  const handleUpdate = async (editTitle, editDescription) => {
    const result = await updateDocumentation({
      id: Number(docId),
      name: editTitle,
      description: editDescription,
    });

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === "success") {
      setEditModal(false);
      refreshData();
      toastMessage(result.data.message, "success");
    }
  };

  const handleDeletePageGroup = async (id, path) => {

    let result;

    if (path === "pageGroup") {
      result = await deletePageGroup(Number(id));
    } else if (path === "page") {
      result = await deletePage(Number(id));
    }

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === "success") {
      setDeleteModal(false);
      toastMessage(result.data.message, "success");
      refreshData();
    }
  };

  const handlePageGroupUpdate = async (editTitle, editDescription, id) => {
    const result = await updatePageGroup({
      id: Number(id),
      name: editTitle,
      documentationId: Number(docId),
    });

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === "success") {
      setEditModal(false);
      refreshData();
      toastMessage(result.data.message, "success");
    }
  };

  const handleCreatePageGroup = async (title) => {
    if (title === "") {
      toastMessage(
        "Title is required. Please Enter PageGroup title",
        "warning"
      );
      return;
    }

    const result = await createPageGroup({
      name: title,
      documentationId: Number(docId),
    });

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === "success") {
      setCreatePageGroupModal(false);
      refreshData();
      toastMessage(result.data.message, "success");
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const newItems = Array.from(documentationData);
    const [reorderedItem] = newItems.splice(result.source.index, 1);

    newItems.splice(result.destination.index, 0, reorderedItem);

    setDocumentationData(newItems);

    const updateOrder = async (item, index) => {
      try {
        const endpoint = item?.name
          ? "/docs/page-group/reorder"
          : "/docs/page/reorder";
        await instance.post(endpoint, {
          id: item.id,
          documentationId: docId,
          order: index,
        });
      } catch (err) {
        console.error(err);
        if (!err.response || err?.response?.status === 500) {
          toastMessage(err?.message, "error");
          navigate("/server-down");
          return;
        }
        toastMessage(err?.response?.data?.message, "error");
      }
    };

    await Promise.all(newItems.map((item, index) => updateOrder(item, index)));
    refreshData();
  };

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("Version 1.0"); // Default version
  const versions = [
    "Version 1.0",
    "Version 1.1",
    "Version 1.2",
    "Version 2.0",
    "Version 2.1",
  ];

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSearchVersionChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleVersionSelect = (version) => {
    setSelectedVersion(version);
    setShowDropdown(false); // Close dropdown after selection
  };

  const filteredOptions = versions.filter((version) =>
    version.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <AnimatePresence className="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5">
      <Breadcrumb />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className=" lg:mt-0 lg:col-span-5 flex justify-end mr-5 gap-3"
        key="documentation-actions"
      >
        <motion.button whilehover={{ scale: 1.3 }} title="Clone Documentation">
          <Icon
            icon="clarity:clone-line"
            className="w-6 h-6 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-700"
          />
        </motion.button>

        <motion.button
          whilehover={{ scale: 1.3 }}
          onClick={() => {
            setCurrentItem(null);
            setEditModal(true);
          }}
          title="Edit Documentation"
        >
          <Icon
            icon="material-symbols:edit-outline"
            className="w-6 h-6 text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-600"
          />
        </motion.button>

        <motion.button
          whilehover={{ scale: 1.3 }}
          onClick={() => {
            setCurrentItem(null);
            setDeleteModal(true);
          }}
          title="Delete Documentation"
        >
          <Icon
            icon="material-symbols:delete"
            className="w-6 h-6 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-600"
          />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="grid max-w-screen-xl"
        key="documentation-info"
      >
        <div className="mr-auto place-self-center lg:col-span-7">
          <h1 className="max-w-xl mb-4 text-4xl font-bold tracking-tight leading-none md:text-4xl xl:text-4xl dark:text-white">
            {documentData.name}
          </h1>
          <p className="max-w-2xl mb-6 font-light text-gray-700 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">
            {documentData.description}
          </p>
        </div>
      </motion.div>

      {filteredItems && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.1 }}
          className=""
          key="documentation-table"
        >
          <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4">
              <div className="w-full md:w-1/3">
                <div className="flex items-center">
                  <label htmlFor="simple-search" className="sr-only">
                    Search
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
                      placeholder="Search"
                    />
                  </div>
                </div>
              </div>

              <div className="relative inline-block border-black">
                <div
                  id="dropdownSelect"
                  className="flex items-center border border-gray-400 hover:bg-gray-200 px-3 py-1.5 rounded-lg cursor-pointer dark:bg-gray-600 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-white"
                  onClick={toggleDropdown}
                >
                  {selectedVersion} {/* Display the selected version */}
                  <svg
                    className="w-2.5 h-2.5 ms-3"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </div>

                {showDropdown && (
                  <div
                    id="dropdownSearch"
                    className="z-10  absolute bg-white rounded-lg shadow w-52 dark:bg-gray-700"
                  >
                    <div className="p-1 h-auto w-full">
                      <label htmlFor="input-group-search" className="sr-only">
                        Search
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="input-group-search"
                          className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          placeholder="Search version"
                          value={searchQuery}
                          onChange={handleSearchVersionChange}
                        />
                      </div>

                      <ul
                        className="h-auto w-full mt-2 overflow-y-auto text-sm text-gray-700 dark:text-gray-200"
                        aria-labelledby="dropdownSelect"
                      >
                        {filteredOptions.length > 0 ? (
                          filteredOptions.map((option, index) => (
                            <li key={index} className="relative w-full">
                              <div
                                className=" flex items-center ps-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
                                onClick={() => handleVersionSelect(option)}
                              >
                                <p className="w-full p-3 ms-2 text-md font-medium text-gray-900 rounded dark:text-gray-300">
                                  {option}
                                </p>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li>
                            <div className="flex items-center ps-2 rounded">
                              <span className="w-full py-2 ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300">
                                No options found
                              </span>
                            </div>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0">
                <motion.button
                  whilehover={{ scale: 1.1 }}
                  onClick={() => setCreatePageGroupModal(true)}
                  type="button"
                  className="flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
                >
                  <span className=" px-1 text-left items-center dark:text-white text-md ">
                    New Group
                  </span>
                  <Icon icon="ei:plus" className="w-6 h-6 dark:text-white" />
                </motion.button>

                <motion.button whilehover={{ scale: 1.1 }}>
                  <Link
                    to={`/dashboard/documentation/create-page?id=${docId}&dir=true`}
                    className="flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
                  >
                    <span className="px-1 text-left items-center dark:text-white text-md">
                      New Page
                    </span>
                    <Icon icon="ei:plus" className="w-6 h-6 dark:text-white" />
                  </Link>
                </motion.button>
              </div>
            </div>

            {filteredItems && (
              <div className="overflow-x-auto h-auto">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="table" type="TABLE">
                    {(provided) => (
                      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                          <tr>
                            <th />
                            <th scope="col" className="px-4 py-3">
                              Title
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 whitespace-nowrap"
                            >
                              Author / Editor
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 whitespace-nowrap"
                            >
                              Create / update
                            </th>
                            <th scope="col" className="px-4 py-3" />
                          </tr>
                        </thead>

                        <tbody
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {loading ? (
                            <tr className="border-b dark:border-gray-700">
                              <td colSpan="12" className="p-8">
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
                          ) : !filteredItems === null ||
                            filteredItems.length <= 0 ? (
                            <motion.tr
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="border-b dark:bg-gray-700"
                            >
                              <td colSpan="12" className="text-center p-8">
                                <h1 className="text-center text-gray-600 sm:text-lg font-semibold">
                                  No Pages Found
                                </h1>
                              </td>
                            </motion.tr>
                          ) : (
                            filteredItems.map((obj, index) => (
                              <Draggable
                                key={
                                  obj.name
                                    ? `pageGroup-${obj.id}`
                                    : `page-${obj.id}`
                                }
                                draggableId={
                                  obj.name
                                    ? `pageGroup-${obj.id}`
                                    : `page-${obj.id}`
                                }
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <Table
                                    provided={provided}
                                    snapshot={snapshot}
                                    obj={obj}
                                    index={index}
                                    docId={docId}
                                    pageGroupId={obj.id}
                                  />
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </tbody>
                      </table>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}

            {/* Edit Component */}
            {editModal && (
              <EditDocumentModal
                heading={
                  currentItem ? "Rename Page Group" : "Edit Documentation"
                }
                title={currentItem ? currentItem.name : documentData.name}
                description={currentItem ? "" : documentData.description}
                id={currentItem ? currentItem.id : documentData.id}
                updateData={currentItem ? handlePageGroupUpdate : handleUpdate}
              />
            )}

            {deleteModal && (
              <DeleteModal
                deleteDoc={
                  currentItem
                    ? () => handleDeletePageGroup(currentItem.id, deleteItem)
                    : handleDelete
                }
                id={currentItem ? currentItem.id : documentData.id}
                title="Are you sure?"
                message={`You're permanently deleting "${currentItem
                  ? currentItem.name || currentItem.title
                  : documentData.name
                  }`}
              />
            )}
          </div>
        </motion.div>
      )}
      {/* Create pageGroup resusable component */}
      {createPageGroupModal && (
        <CreatePageGroup
          handleCreate={handleCreatePageGroup}
          key="create-page-group-0"
        />
      )}
    </AnimatePresence>
  );
}
