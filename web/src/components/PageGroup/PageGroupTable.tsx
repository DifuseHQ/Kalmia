import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  commonReorderBulk,
  createPage as createPageAPI,
  createPageGroup,
  deletePage,
  deletePageGroup,
  getPageGroup,
  updatePageGroup,
} from "../../api/Requests";
import { AuthContext, AuthContextType } from "../../context/AuthContext";
import { ModalContext, ModalItem } from "../../context/ModalContext";
import { isPage, isPageGroup, PageGroup, PageOrGroup } from "../../types/doc";
import {
  getLastPageOrder,
  handleError,
  sortGroupAndPage,
} from "../../utils/Common";
import { toastMessage } from "../../utils/Toast";
import Breadcrumb from "../Breadcrumb/Breadcrumb";
import BuildTrigger from "../BuildTrigger/BuildTrigger";
import EditDocumentModal from "../CreateDocumentModal/EditDocumentModal";
import CreatePageGroup from "../CreatePageGroup/CreatePageGroup";
import CreatePage from "../CreatePageModal/CreatePageModal";
import DeleteModal from "../DeleteModal/DeleteModal";
import Table from "../Table/Table";

export default function PageGroupTable() {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get("id");
  const pageGroupId = searchParams.get("pageGroupId");
  const version = searchParams.get("version");
  const versionId = searchParams.get("versionId");

  const { t } = useTranslation();

  const [groupDetail, setGroupDetail] = useState<PageGroup>();
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<PageOrGroup[]>([]);

  const { refresh, refreshData } = useContext(AuthContext) as AuthContextType;

  const {
    openModal,
    closeModal,
    createPageGroupModal,
    createPageModal,
    deleteModal,
    editModal,
    currentModalItem,
  } = useContext(ModalContext);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (pageGroupId) {
        const result = await getPageGroup(parseInt(pageGroupId));

        if (handleError(result, navigate, t)) {
          return;
        }

        if (result.status === "success") {
          setGroupDetail(result.data);
          const groupData = result.data.pageGroups;
          const pages = result.data.pages;

          const combineData = sortGroupAndPage(groupData || [], pages || []);
          setData(combineData);
        }
      }
    };

    if (docId) {
      fetchData();
    }
  }, [docId, pageGroupId, navigate, refresh]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredItems = data.filter((obj: PageOrGroup) => {
    const isInCorrectGroup =
      (isPageGroup(obj) && obj.parentId === Number(pageGroupId)) ||
      (isPage(obj) && obj.pageGroupId === Number(pageGroupId));

    const matchesSearch =
      (isPageGroup(obj) &&
        obj.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (isPage(obj) &&
        obj.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return isInCorrectGroup && matchesSearch;
  });

  const handleCreatePageGroup = async (title: string) => {
    if (title === "") {
      toastMessage(t("title_is_required"), "warning");
      return;
    }

    const lastOrder = getLastPageOrder(data);
    const result = await createPageGroup({
      name: title,
      documentationId: Number(docId),
      parentId: Number(pageGroupId),
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

  const handleDeletePageGroup = async (id: number, item: ModalItem) => {
    let result;
    if ("slug" in item) {
      result = await deletePage(id);
    } else {
      result = await deletePageGroup(id);
    }

    if (handleError(result, navigate, t)) {
      return;
    }

    if (result.status === "success") {
      toastMessage(t(result.data.message), "success");
      closeModal("delete");
      refreshData();
    }
  };

  const handlePageGroupUpdate = async (
    editTitle: string,
    _version: string,
    id: number,
  ) => {
    const result = await updatePageGroup({
      id: Number(id),
      name: editTitle,
      documentationId: Number(docId),
      parentId: Number(pageGroupId),
    });

    if (handleError(result, navigate, t)) {
      return;
    }

    if (result.status === "success") {
      closeModal("edit");
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

    const lastOrder = getLastPageOrder(data);
    const docIdOrVersionId = versionId || docId;

    if (!docIdOrVersionId || !pageGroupId) {
      console.error("documentationId or pageGroupId is missing");
      return;
    }

    const result = await createPageAPI({
      title,
      slug,
      content: JSON.stringify([]),
      documentationId: parseInt(docIdOrVersionId ?? undefined),
      pageGroupId: parseInt(pageGroupId ?? undefined),
      order: lastOrder,
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
    if (!result.destination) {
      return;
    }

    if(result.destination.index === result.source.index){
      toastMessage(t("item_dropped_in_the_same_position_no_changes_made"), "warning");
      return;
    }

    const newItems = Array.from(data);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    const dragItem = reorderedItem;
    newItems.splice(result.destination.index, 0, reorderedItem);
    setData(newItems);

    const updateOrder = async (item: PageOrGroup, index: number) => {
      const payload: {
        id: number;
        documentationId: number;
        order: number;
        parentId?: number;
        isPageGroup?: boolean;
        pageGroupId?: number;
      } = {
        id: item.id,
        documentationId: Number(docId),
        order: index,
      };

      if ("name" in item) {
        payload.parentId = Number(pageGroupId);
        payload.isPageGroup = true;
      } else {
        payload.pageGroupId = Number(pageGroupId);
      }

      const result = await commonReorderBulk({ order: [payload] });
      if (handleError(result, navigate, t)) return;
    };

    try {
      await Promise.all(
        newItems.map((item, index) => updateOrder(item, index)),
      );
      toastMessage(
        t(`${"slug" in dragItem ? "page_reordered" : "page_group_reordered"}`),
        "success",
      );
    } catch (err) {
      console.error("Error in Promise.all:", err);
    }
    refreshData();
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5">
      <AnimatePresence>
        <Breadcrumb />

        {createPageGroupModal && (
          <CreatePageGroup
            handleCreate={handleCreatePageGroup}
            key="create-nest-page=group"
          />
        )}

        {createPageModal && (
          <CreatePage
            handleCreate={handleCreatePage}
            key="create-nest-page-0"
          />
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid max-w-screen-xl"
          key="pageGroupName"
        >
          <div className="mr-auto place-self-center lg:col-span-7">
            <h1 className="max-w-xl mb-4 text-4xl font-bold tracking-tight leading-none md:text-4xl xl:text-4xl dark:text-white">
              {groupDetail?.name}
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.1 }}
          className=""
          key="pageGroupTable"
        >
          <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
            <div className="flex flex-col xl:flex-row items-center justify-between space-y-3 xl:space-y-0 md:space-x-4 p-4">
              <div className="flex items-center w-full xl:w-auto space-x-2">
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

                <div
                  className="px-5 py-1.5 rounded-lg font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  title="Version"
                >
                  {version}
                </div>

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
                >
                  <span className="px-1 text-left items-center dark:text-white text-md whitespace-nowrap">
                    {t("new_group")}
                  </span>
                  <Icon icon="ei:plus" className="w-6 h-6 dark:text-white" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => openModal("createPage", null)}
                  type="button"
                  className="flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
                  key="create-nest-page-button"
                >
                  <span className="px-1 text-left items-center dark:text-white text-md whitespace-nowrap">
                    {t("new_page")}
                  </span>
                  <Icon icon="ei:plus" className="w-6 h-6 dark:text-white" />
                </motion.button>
              </div>
            </div>

            <div className="overflow-x-auto h-auto">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="table" type="TABLE">
                  {(provided) => (
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr key="table-header">
                          <th scope="col" className="px-4 py-3" />
                          <th scope="col" className="px-4 py-3">
                            {t("title")}
                          </th>
                          <th scope="col" className="px-4 py-3">
                            {t("author_editor")}
                          </th>
                          <th scope="col" className="px-4 py-3">
                            {t("create_update")}
                          </th>
                          <th scope="col" className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {filteredItems.length <= 0 && (
                          <tr
                            className="border-b dark:border-gray-700"
                            key="no-data"
                          >
                            <td colSpan={4} className="text-center p-8">
                              <h1 className="text-center text-gray-600 sm:text-lg font-semibold">
                                {t("no_pages_found")}
                              </h1>
                            </td>
                          </tr>
                        )}

                        {filteredItems.map((obj, index) => (
                          <Draggable
                            key={
                              isPageGroup(obj)
                                ? `pageGroup-${obj.id}`
                                : `page-${obj.id}`
                            }
                            draggableId={
                              isPageGroup(obj)
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
                                dir="false"
                                docId={
                                  versionId ? parseInt(versionId) : undefined
                                }
                                version={version ?? undefined}
                                pageGroupId={parseInt(pageGroupId ?? "")}
                              />
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}
                      </tbody>
                    </table>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        </motion.div>

        {editModal && currentModalItem && (
          <EditDocumentModal
            title={currentModalItem.name}
            id={currentModalItem.id}
            updateData={handlePageGroupUpdate}
            key="editPageGroup"
          />
        )}

        {deleteModal && currentModalItem && (
          <DeleteModal
            deleteDoc={() =>
              handleDeletePageGroup(currentModalItem.id, currentModalItem)
            }
            id={currentModalItem.id}
            message={currentModalItem.name || currentModalItem.title}
            key="deletePageGroup"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
