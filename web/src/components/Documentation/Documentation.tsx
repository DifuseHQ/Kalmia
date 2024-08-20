import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  ApiResponse,
  commonReorderBulk,
  createDocumentationVersion,
  createPage as createPageAPI,
  createPageGroup,
  deleteDocumentation,
  deletePage,
  deletePageGroup,
  getDocumentations,
  getPageGroups,
  getPages,
  updatePageGroup,
} from "../../api/Requests";
import { AuthContext, AuthContextType } from "../../context/AuthContext";
import { ModalContext, ModalItem } from "../../context/ModalContext";
import {
  Documentation as DocumentationData,
  Page,
  PageGroup,
} from "../../types/doc";
import { DOMEvent } from "../../types/dom";
import {
  combinePages,
  createOrderItems,
  getClosestVersion,
  getLastPageOrder,
  getVersion,
  handleError,
  isPageGroup,
} from "../../utils/Common";
import { toastMessage } from "../../utils/Toast";
import { pageSizes } from "../../utils/Utils";
import Breadcrumb from "../Breadcrumb/Breadcrumb";
import BuildTrigger from "../BuildTrigger/BuildTrigger";
import EditDocumentModal from "../CreateDocumentModal/EditDocumentModal";
import CreatePageGroup from "../CreatePageGroup/CreatePageGroup";
import CreatePage from "../CreatePageModal/CreatePageModal";
import DeleteModal from "../DeleteModal/DeleteModal";
import Table from "../Table/Table";

interface VersionOption {
  id: number;
  version: string;
  createdAt: string;
}

export default function Documentation() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { refresh, refreshData, user } = authContext as AuthContextType;
  const { t } = useTranslation();

  const {
    openModal,
    closeModal,
    createPageGroupModal,
    createPageModal,
    deleteModal,
    editModal,
    cloneDocumentModal,
    currentModalItem,
    pageSizeDropdown,
  } = useContext(ModalContext);

  const [searchParam] = useSearchParams();
  const docId = searchParam.get("id");
  const versionId = searchParam.get("versionId");
  const [loading, setLoading] = useState<boolean>(true);
  const [pageGroupLoading, setPageGroupLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectPageSize, setSelectPageSize] = useState<number>(50);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Documentation CRUD
  const [documentData, setDocumentData] = useState<DocumentationData[]>([]);

  // pageGroup CRUD
  const [groupsAndPageData, setGroupsAndPageData] = useState<
    (PageGroup | Page)[]
  >([]);

  // version
  const [showVersionDropdown, setShowVersionDropdown] =
    useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<VersionOption | null>(
    null,
  );

  const toggleDropdown = () => {
    setShowVersionDropdown(!showVersionDropdown);
  };

  const handleSearchVersionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleVersionSelect = (version: VersionOption) => {
    const selectVersion = {
      id: version.id,
      createdAt: version.createdAt,
      version: version.version,
    };

    setSelectedVersion(selectVersion);
    setShowVersionDropdown(false);
    navigate(
      `/dashboard/documentation?id=${docId}&versionId=${version.id}&version=${version.version}`,
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const versionIdString = searchParam.get("versionId");
      const versionId: number | null = versionIdString
        ? parseInt(versionIdString, 10)
        : null;
      const documentationsResult = await getDocumentations();

      if (handleError(documentationsResult, navigate, t)) {
        setLoading(false);
        return;
      }

      if (documentationsResult.status === "success") {
        const data: DocumentationData[] = documentationsResult.data;

        const getAllVersions = (data: DocumentationData[], startId: number) => {
          const versions: DocumentationData[] = [];

          const addVersion = (doc: DocumentationData) => {
            versions.push(doc);
            const children = data.filter((item) => item.clonedFrom === doc.id);
            children.forEach(addVersion);
          };

          const startDoc = data?.find((doc) => doc.id === startId);
          if (startDoc) {
            if (
              startDoc.clonedFrom !== null &&
              startDoc.clonedFrom !== undefined
            ) {
              const parent = data?.find(
                (doc) => doc.id === startDoc.clonedFrom,
              );
              if (parent) {
                addVersion(parent);
              } else {
                addVersion(startDoc);
              }
            } else {
              addVersion(startDoc);
            }
          }

          return versions.sort((a, b) => {
            return a.version.localeCompare(b.version, undefined, {
              numeric: true,
              sensitivity: "base",
            });
          });
        };

        const clonedData: DocumentationData[] = getAllVersions(
          data,
          Number(docId),
        );

        setDocumentData(clonedData);

        if (versionId) {
          const currentVersion = getVersion(clonedData, versionId);
          setSelectedVersion(currentVersion);
        } else {
          const latestVersion: VersionOption | null =
            getClosestVersion(clonedData);
          setSelectedVersion(latestVersion);
        }
      }
      setLoading(false);
    };
    if (docId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [docId, refresh, user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setPageGroupLoading(true);
      const [pageGroupsResult, pagesResult] = await Promise.all([
        getPageGroups(),
        getPages(),
      ]);

      handleError(pageGroupsResult, navigate, t);
      handleError(pagesResult, navigate, t);

      if (
        pageGroupsResult.status === "success" &&
        pagesResult.status === "success"
      ) {
        const combinedData: (PageGroup | Page)[] = combinePages(
          pageGroupsResult.data || [],
          pagesResult.data || [],
        );

        setGroupsAndPageData(combinedData);
      }
      setPageGroupLoading(false);
    };
    if (docId) {
      fetchData();
    } else {
      setPageGroupLoading(false);
    }
  }, [docId, user, navigate, refresh, versionId]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredItems: (PageGroup | Page)[] = groupsAndPageData.filter(
    (obj) => {
      if (selectedVersion) {
        const isPage = (obj as Page).title !== undefined;
        const isPageGroup = (obj as PageGroup).name !== undefined;
        return (
          obj.documentationId === selectedVersion.id &&
          ((isPageGroup &&
            (obj as PageGroup).name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
            (isPage &&
              (obj as Page).title
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())))
        );
      }
      return false;
    },
  );

  const handleDelete = async (): Promise<void> => {
    if (selectedVersion) {
      const result = await deleteDocumentation(selectedVersion.id);

      if (handleError(result, navigate, t)) {
        return;
      }

      if (result.status === "success") {
        closeModal("delete");
        toastMessage(t(result.data.message), "success");
        refreshData();
        navigate("/");
      }
    }
  };

  const handleUpdate = async (
    _editTitle: string,
    version: string,
    _id: number, // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    let result: ApiResponse | undefined;
    if (cloneDocumentModal) {
      result = await createDocumentationVersion({
        originalDocId: Number(selectedVersion?.id),
        version,
      });
    }

    if (result && handleError(result, navigate, t)) return;

    if (result?.status === "success") {
      if (cloneDocumentModal) {
        closeModal("cloneDocument");
      }
      refreshData();
      toastMessage(t(result.data?.message), "success");
    }
  };

  const handleDeletePageGroup = async (id: number, path: ModalItem) => {
    const type = "slug" in path ? "page" : "pageGroup";
    let result: ApiResponse | undefined;

    if (type === "pageGroup") {
      result = await deletePageGroup(id);
    } else if (type === "page") {
      result = await deletePage(id);
    }

    if (result && handleError(result, navigate, t)) {
      return;
    }

    if (result?.status === "success") {
      closeModal("delete");
      toastMessage(t(result.data?.message), "success");
      refreshData();
    }
  };

  const handlePageGroupUpdate = async (
    editTitle: string,
    _version: string,
    id: number,
  ) => {
    const result = await updatePageGroup({
      id,
      name: editTitle,
      documentationId: Number(selectedVersion?.id),
    });

    if (handleError(result, navigate, t)) {
      return;
    }

    if (result?.status === "success") {
      closeModal("edit");
      refreshData();
      toastMessage(t(result.data?.message), "success");
    }
  };

  const handleCreatePageGroup = async (title: string) => {
    if (title === "") {
      toastMessage(t("title_is_required"), "warning");
      return;
    }
    const lastOrder: number = getLastPageOrder(groupsAndPageData);
    const result = await createPageGroup({
      name: title,
      documentationId: Number(selectedVersion?.id),
      order: lastOrder,
    });

    if (handleError(result, navigate, t)) {
      return;
    }

    if (result.status === "success") {
      closeModal("createPageGroup");
      refreshData();
      toastMessage(t(result.data.message), "success");
    }
  };

  const handleCreatePage = async (title: string, slug: string) => {
    if (title === "") {
      toastMessage(t("title_is_required"), "warning");
      return;
    }
    if (slug === "") {
      toastMessage(t("slug_is_required"), "warning");
      return;
    }
    const lastOrder: number = getLastPageOrder(groupsAndPageData);
    const docIdOrVersionId = selectedVersion?.id ? selectedVersion.id : docId;

    const result = await createPageAPI({
      title,
      slug,
      content: JSON.stringify([]),
      documentationId: Number(docIdOrVersionId),
      order: Number(lastOrder),
    });

    if (handleError(result, navigate, t)) {
      return;
    }

    if (result.status === "success") {
      closeModal("createPage");
      refreshData();
      toastMessage(t(result.data.message), "success");
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const newItems = Array.from(
      groupsAndPageData.filter(
        (obj) => obj.documentationId === Number(selectedVersion?.id),
      ),
    );

    if (result?.combine) {
      const ParentItemId = result.combine.draggableId;
      const extractedParentd = ParentItemId.split(":");

      if (extractedParentd?.[0] === "pageGroup") {
        const reorderedItem = newItems[result?.source?.index];
        const dragItem = reorderedItem as PageGroup | Page;
        const type = isPageGroup(reorderedItem);

        if (type) {
          reorderedItem.parentId = Number(extractedParentd[1]);
        } else {
          reorderedItem.pageGroupId = Number(extractedParentd[1]);
        }

        const allItems = createOrderItems(newItems);

        try {
          const result = await commonReorderBulk({ order: allItems });

          if (handleError(result, navigate, t)) return;
          const type = "slug" in dragItem ? "page" : "pageGroup";
          toastMessage(
            t(`${type === "page" ? "page_inserted" : "pageGroup_inserted"}`),
            "success",
          );
        } catch (err) {
          console.error("Error in bulk reordering:", err);
        }
      } else {
        toastMessage(
          t("its_not_possible_to_insert_pageGroup_into_page"),
          "warning",
        );
      }
    } else {
      if (!result.destination) {
        return;
      }

      if (result.destination.index === result.source.index) {
        toastMessage(
          t("item_dropped_in_the_same_position_no_changes_made"),
          "warning",
        );
        return;
      }

      const newIndex: number = result.destination.index;
      const oldDataAtNewPosition = newItems[newIndex] as PageGroup | Page;

      if (
        "isIntroPage" in oldDataAtNewPosition &&
        oldDataAtNewPosition.isIntroPage
      ) {
        toastMessage(t("intro_page_cannot_be_reordered"), "warning");
        return;
      }

      const [reorderedItem] = newItems.splice(result.source.index, 1);
      const dragItem = reorderedItem as PageGroup | Page;
      newItems.splice(result.destination.index, 0, reorderedItem);

      setGroupsAndPageData(newItems);

      const allItems = createOrderItems(newItems);

      try {
        const result = await commonReorderBulk({ order: allItems });

        if (handleError(result, navigate, t)) return;
        const type = "slug" in dragItem ? "page" : "pageGroup";
        toastMessage(
          t(`${type === "page" ? "page_reordered" : "page_group_reordered"}`),
          "success",
        );
      } catch (err) {
        console.error("Error in bulk reordering:", err);
      }
    }

    refreshData();
  };

  const filteredVersions = documentData.filter((version) =>
    version.version.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const itemsPerPage = selectPageSize;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = useCallback(
    (pageNumber: number) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
      }
    },
    [totalPages],
  );

  const handlePageSizeSelect = (value: number) => {
    setSelectPageSize(value);
    closeModal("pageSizeDropdown");
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (event: DOMEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowVersionDropdown(false);
        closeModal("pageSizeDropdown");
      }
    },
    [closeModal],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  // Type guard to check if an object is a Page
  function isPage(obj: PageGroup | Page): obj is Page {
    return (obj as Page).isIntroPage !== undefined;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-1 sm:p-1">
      <AnimatePresence>
        <Breadcrumb key="breadcrumb-container" />

        {!loading && (
          <>
            {documentData.length !== 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="documentation-component-container"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className=" lg:mt-0 lg:col-span-5 flex justify-end mr-5 mb-4 gap-3"
                  key="documentation-actions-buttons"
                >
                  <motion.button
                    whileHover={{ scale: 1.3 }}
                    onClick={() => {
                      openModal("cloneDocument", null);
                    }}
                    title={t("clone_documentation")}
                    key="clone-button"
                  >
                    <Icon
                      icon="clarity:clone-line"
                      className="w-6 h-6 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-700"
                    />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.3 }}
                    title={t("edit_documentation")}
                    key="edit-document-button"
                  >
                    <Link
                      to={`/dashboard/edit-documentation?id=${selectedVersion?.id}&mode=edit`}
                    >
                      <Icon
                        icon="material-symbols:edit-outline"
                        className="w-6 h-6 text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-600"
                      />
                    </Link>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.3 }}
                    onClick={() => {
                      openModal("delete", null);
                    }}
                    key="delete-document-button"
                    title={t("delete_documentation")}
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
                    <h1 className="max-w-xl mb-4 text-2xl font-bold tracking-tight leading-none md:text-3xl xl:text-4xl dark:text-white">
                      {documentData[0]?.name}
                    </h1>
                    <p className="max-w-2xl mb-6 font-light text-sm text-gray-700 lg:mb-8 md:text-md lg:text-xl dark:text-gray-400">
                      {documentData[0]?.description}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg"
                  key="documentation-table"
                >
                  <div className="flex flex-col xl:flex-row items-center justify-between space-y-3 xl:space-y-0 md:space-x-4 p-4">
                    <div
                      className="flex justify-start items-center w-full xl:w-auto space-x-2"
                      key="versioning-container"
                    >
                      <div className="relative w-full xl:w-64">
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

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key="documentation-version-listing-container"
                        className="relative inline-block z-20 "
                      >
                        <div
                          id="dropdownSelect"
                          className="flex items-center border gap-2 border-gray-400 hover:bg-gray-200 px-3 py-1.5 rounded-lg cursor-pointer dark:bg-gray-600 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-white"
                          onClick={toggleDropdown}
                        >
                          {selectedVersion?.version}
                          <Icon icon="mingcute:down-fill" className="h-6 w-6" />
                        </div>

                        {showVersionDropdown && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key="documettaion-table-version-dropdown"
                            ref={dropdownRef}
                            id="dropdownSearch"
                            className="absolute right-0 lg:left-0 bg-white rounded-lg shadow w-52 dark:bg-gray-700 z-30"
                          >
                            <div className="p-1 h-auto w-full">
                              <span className="sr-only">
                                {t("search_placeholder")}
                              </span>
                              {filteredVersions.length >= 0 ? (
                                <div className="relative">
                                  <input
                                    type="text"
                                    id="input-group-search"
                                    className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder={t("search_version")}
                                    value={searchQuery}
                                    onChange={handleSearchVersionChange}
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center ps-2 rounded">
                                  <span className="w-full py-2 ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300">
                                    {t("no_versions_found")}
                                  </span>
                                </div>
                              )}
                              <motion.ul
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                key="documentaion-version-listing"
                                className="min-h-10 h-auto max-h-32 w-full mt-2 overflow-y-auto text-sm text-gray-700 dark:text-gray-200"
                                aria-labelledby="dropdownSelect"
                              >
                                {filteredVersions.length > 0 ? (
                                  filteredVersions.map((option) => (
                                    <motion.li
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      key={`version-${option.id}`}
                                      className="relative w-full"
                                    >
                                      <div
                                        className={`flex items-center ps-2 rounded hover:bg-gray-200 cursor-pointer ${selectedVersion?.version === option.version ? "bg-gray-400 hover:bg-gray-400 dark:bg-gray-900 cursor-text dark:hover:bg-gray-900" : "dark:hover:bg-gray-800"}`}
                                        onClick={() =>
                                          handleVersionSelect(option)
                                        }
                                      >
                                        <p className="w-full p-2.5 ms-2 text-md font-medium text-gray-900 rounded dark:text-gray-300">
                                          {option.version}
                                        </p>
                                      </div>
                                    </motion.li>
                                  ))
                                ) : (
                                  <motion.li
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    key="no-version-found-message"
                                  >
                                    <div className="flex items-center ps-2 rounded">
                                      <span className="w-full py-2 ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300">
                                        {t("no_matched_versions")}
                                      </span>
                                    </div>
                                  </motion.li>
                                )}
                              </motion.ul>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                      <div className="hidden xl:block">
                        <BuildTrigger />
                      </div>
                    </div>
                    <div className="flex justify-center xl:hidden">
                      <BuildTrigger />
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => openModal("createPageGroup", null)}
                        type="button"
                        className="flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
                        key="create-page-group-button"
                      >
                        <span className="px-1 text-left items-center dark:text-white text-md">
                          {t("new_group")}
                        </span>
                        <Icon
                          icon="ei:plus"
                          className="w-6 h-6 dark:text-white"
                        />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => openModal("createPage", null)}
                        type="button"
                        className="flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
                        key="create-page-button"
                      >
                        <span className="px-1 text-left items-center dark:text-white text-md">
                          {t("new_page")}
                        </span>
                        <Icon
                          icon="ei:plus"
                          className="w-6 h-6 dark:text-white"
                        />
                      </motion.button>
                    </div>
                  </div>

                  {filteredItems && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key="documentation-table-container"
                      className="overflow-x-auto h-auto"
                    >
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable
                          droppableId="table"
                          type="TABLE"
                          isCombineEnabled
                        >
                          {(provided) => (
                            <motion.table
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              key="table-documentation-table-tag"
                              className="w-full text-sm text-left text-gray-500 dark:text-gray-400"
                            >
                              <motion.thead
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                key="table-documentation-head"
                                className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
                              >
                                <tr key="table-documentation-head-row">
                                  <th className="w-1/12 whitespace-nowrap" />
                                  <th className="w-3/12 px-4 py-3 whitespace-nowrap">
                                    {t("title")}
                                  </th>
                                  <th className="w-3/12 px-4 py-3 whitespace-nowrap">
                                    {t("author_editor")}
                                  </th>
                                  <th className="w-2/12 px-4 py-3 whitespace-nowrap">
                                    {t("create_update")}
                                  </th>
                                  <th className="w-3/12 px-4 py-3 whitespace-nowrap" />
                                </tr>
                              </motion.thead>

                              <motion.tbody
                                key="table-documentation-body"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                              >
                                {!pageGroupLoading ? (
                                  filteredItems && filteredItems.length <= 0 ? (
                                    <motion.tr
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="border-b dark:bg-gray-700"
                                      key="no-pages-found-message"
                                    >
                                      <td
                                        colSpan={5}
                                        className="w-12/12 text-center py-12"
                                      >
                                        No Pages Found
                                      </td>
                                    </motion.tr>
                                  ) : (
                                    filteredItems
                                      .slice(startIdx, endIdx)
                                      .map((obj, index) => (
                                        <Draggable
                                          key={
                                            isPageGroup(obj)
                                              ? `pageGroup-${obj.id}-order-${index}`
                                              : `page-${obj.id}-order-${index}`
                                          }
                                          draggableId={
                                            isPageGroup(obj)
                                              ? `pageGroup:${obj.id}`
                                              : `page:${obj.id}`
                                          }
                                          index={index}
                                          isDragDisabled={
                                            isPage(obj) && obj.isIntroPage
                                          }
                                        >
                                          {(provided, snapshot) => (
                                            <Table
                                              provided={provided}
                                              snapshot={snapshot}
                                              obj={obj}
                                              dir="true"
                                              docId={selectedVersion?.id}
                                              pageGroupId={obj.id}
                                              version={selectedVersion?.version}
                                            />
                                          )}
                                        </Draggable>
                                      ))
                                  )
                                ) : (
                                  <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    key="documentation-data-loading-message"
                                  >
                                    <td
                                      colSpan={5}
                                      className="text-center py-12"
                                    >
                                      Loading...
                                    </td>
                                  </motion.tr>
                                )}
                                {provided.placeholder}
                              </motion.tbody>
                            </motion.table>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </motion.div>
                  )}

                  {filteredItems.length > 0 && (
                    <motion.section
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key="documnetation-table-pagination"
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
                        {t("items")}
                      </span>

                      <ul className="inline-flex items-stretch -space-x-px">
                        <li>
                          <div className="flex items-center sm:mx-3 gap-3">
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                              {t("page_size")}
                            </span>
                            <div className="relative inline-block">
                              <button
                                onClick={() =>
                                  openModal("pageSizeDropdown", null)
                                }
                                className="flex items-center justify-between sm:w-16 py-1 px-1 bg-white border dark:text-white border-gray-300 rounded-md shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 text-left"
                              >
                                <span>{selectPageSize}</span>
                                <Icon
                                  icon="mingcute:down-fill"
                                  className="h-5 w-5"
                                />
                              </button>
                              {pageSizeDropdown && (
                                <div
                                  ref={dropdownRef}
                                  className="absolute w-28 bg-white border border-gray-300 rounded-md shadow-lg z-10 dark:bg-gray-700 dark:border-gray-600 bottom-full mb-1 max-h-36 overflow-y-auto"
                                >
                                  {pageSizes().map((option) => (
                                    <div
                                      key={option}
                                      onClick={() =>
                                        handlePageSizeSelect(option)
                                      }
                                      className={`py-2 px-4 cursor-pointer dark:text-white ${selectPageSize === option ? "bg-gray-400 hover:bg-gray-400 dark:hover:bg-gray-900 dark:bg-gray-900 cursor-text" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}
                                    >
                                      {option}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
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
                          <li key={"pagination-" + i}>
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
                    </motion.section>
                  )}
                  {/* Edit Component */}
                  {editModal && (
                    <EditDocumentModal
                      title={currentModalItem?.name}
                      id={currentModalItem?.id ?? 0}
                      updateData={handlePageGroupUpdate}
                    />
                  )}

                  {/* Version Modal */}
                  {cloneDocumentModal && (
                    <EditDocumentModal
                      id={documentData[0]?.id}
                      updateData={handleUpdate}
                    />
                  )}

                  {deleteModal && (
                    <DeleteModal
                      deleteDoc={
                        currentModalItem
                          ? () =>
                              handleDeletePageGroup(
                                currentModalItem?.id,
                                currentModalItem,
                              )
                          : handleDelete
                      }
                      id={
                        currentModalItem
                          ? currentModalItem.id
                          : documentData[0]?.id
                      }
                      message={`${currentModalItem ? `"${currentModalItem.name || currentModalItem.title}"` : `"${documentData[0]?.name}" version ${selectedVersion?.version}`}`}
                    />
                  )}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center"
                key="no-documentation-found-message-conatiner"
              >
                <h1 className="text-gray-600 text-3xl p-10">
                  {t("no_documentations_found")}
                </h1>
              </motion.div>
            )}
            {/* Create pageGroup resusable component */}
            {createPageGroupModal && (
              <CreatePageGroup
                handleCreate={handleCreatePageGroup}
                key="create-page-group-01"
              />
            )}
            {createPageModal && (
              <CreatePage handleCreate={handleCreatePage} key="create-page-0" />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
