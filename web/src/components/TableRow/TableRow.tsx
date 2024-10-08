import { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { Icon } from "@iconify/react/dist/iconify.js";
import { motion } from "framer-motion";
import { memo, useContext } from "react";
import { Link } from "react-router-dom";

import { AuthContext, AuthContextType } from "../../context/AuthContext";
import { ModalContext } from "../../context/ModalContext";
import { Editor, Page, PageGroup } from "../../types/doc";
import { getFormattedDate, hasPermission } from "../../utils/Common";

interface TableProps {
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  docId: string | null;
  pageGroupId: number | undefined | null;
  obj: PageGroup | Page;
  version: string | undefined;
  versionId: number | undefined;
}

const AnimatedTableRow = motion.tr;

export default memo(function TableRow({
  provided,
  snapshot,
  obj,
  pageGroupId,
  docId,
  versionId,
  version,
}: TableProps) {
  const { openModal } = useContext(ModalContext);
  const authContext = useContext(AuthContext);
  const { userDetails } = authContext as AuthContextType;
  function isPage(obj: PageGroup | Page): obj is Page {
    return (obj as Page).isIntroPage === undefined;
  }

  function isPageGroup(obj: PageGroup | Page): obj is PageGroup {
    return "name" in obj;
  }

  return (
    <AnimatedTableRow
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={`${
        snapshot.isDragging
          ? "opacity-80 bg-gray-200 dark:bg-gray-500 border shadow-md shadow-black text-black"
          : ""
      } border dark:border-gray-700 h-16 `}
    >
      <td
        className={`w-1/12 items-center ${!isPage(obj) ? "cursor-not-allowed" : "cursor-pointer"} px-4 py-3 font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap dark:text-white`}
        {...provided.dragHandleProps}
      >
        {hasPermission(["all", "write"], userDetails) && (
          <>
            {isPage(obj) && (
              <Icon
                icon="nimbus:drag-dots"
                className="w-6 h-6 text-gray-600 dark:text-white"
              />
            )}
          </>
        )}
      </td>

      <td className="w-3/12  cursor-pointer px-4 py-3 font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap dark:text-white">
        <Link
          className="flex items-center gap-1"
          to={
            isPageGroup(obj)
              ? `/dashboard/documentation?id=${docId}&pageGroupId=${obj.id}&versionId=${versionId}&version=${version}`
              : `/dashboard/documentation/edit-page?id=${docId}${pageGroupId ? `&pageGroupId=${pageGroupId}` : ""}&pageId=${obj.id}&versionId=${versionId}&version=${version}`
          }
        >
          {isPageGroup(obj) ? (
            <Icon icon="clarity:folder-solid" className="w-6 h-6" />
          ) : (
            <Icon
              icon="iconoir:page"
              className="w-6 h-6 text-gray-500 dark:text-white"
            />
          )}

          {isPageGroup(obj) ? obj.name : obj.title}
        </Link>
      </td>

      <td className="w-3/12 px-4 py-3 cursor-text">
        <div className="flex justify-start items-center gap-2">
          <Icon
            icon="mdi:user"
            className="w-4 h-4 text-gray-500 dark:text-white"
          />
          <span className=" px-1 text-left items-center dark:text-white text-md whitespace-nowrap">
            {obj.author.username}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <Icon
            icon="mdi:edit-outline"
            className="w-4 h-4 text-gray-500 dark:text-white"
          />
          <span className=" px-1 text-left items-center dark:text-white text-md whitespace-nowrap">
            {(() => {
              if (obj.editors && Array.isArray(obj.editors)) {
                if (obj.lastEditorId != null) {
                  const editor = obj.editors?.find(
                    (editor: Editor) =>
                      Number(editor.id) === Number(obj.lastEditorId),
                  );
                  return editor ? editor.username : "None";
                } else {
                  return obj.editors[0]?.username || "None";
                }
              }
              return "None";
            })()}
          </span>
        </div>
      </td>

      <td className="w-2/12  px-4 py-3 cursor-text">
        <div
          className="flex justify-start items-center gap-2"
          title="Creation Date"
        >
          <Icon
            icon="mdi:clock-plus-outline"
            className="w-4 h-4 text-gray-500 dark:text-white"
          />
          <span className=" px-1 text-left items-center dark:text-white text-md whitespace-nowrap">
            {getFormattedDate(obj.createdAt)}
          </span>
        </div>
        <div className="flex gap-2 items-center" title="Last Update Date">
          <Icon
            icon="mdi:clock-edit-outline"
            className="w-4 h-4 text-gray-500 dark:text-white"
          />
          <span className=" px-1 text-left items-center dark:text-white text-md whitespace-nowrap">
            {getFormattedDate(obj.updatedAt)}
          </span>
        </div>
      </td>

      {isPageGroup(obj) ? (
        <td className="text-center w-3/12 px-4 py-3 cursor-pointer relative whitespace-nowrap">
          {hasPermission(["all", "write"], userDetails) && (
            <button
              className="inline-flex items-center px-1.5 gap-2 p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100"
              onClick={() => {
                openModal("pageGroupListModal", obj);
              }}
            >
              <Icon icon="hugeicons:move" className="w-6 h-6" />
            </button>
          )}

          {hasPermission(["all", "write"], userDetails) && (
            <button
              id={`dropdown-button-${obj.id}`}
              data-dropdown-toggle={`dropdown-${obj.id}`}
              className="inline-flex items-center gap-2 p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100"
              type="button"
            >
              <Icon
                icon="material-symbols:edit-outline"
                className="w-6 h-6 text-yellow-500 dark:text-yellow-400"
                onClick={() => {
                  openModal("edit", obj);
                }}
              />
            </button>
          )}

          {hasPermission(["all", "delete"], userDetails) && (
            <button
              id={`dropdown-button-${obj.id}`}
              data-dropdown-toggle={`dropdown-${obj.id}`}
              className="inline-flex items-center gap-2 p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100"
              type="button"
            >
              <Icon
                icon="material-symbols:delete"
                className="w-6 h-6 text-red-600 dark:text-red-500"
                onClick={() => {
                  openModal("delete", obj);
                }}
              />
            </button>
          )}
        </td>
      ) : (
        <td className="text-center px-4 py-3 cursor-pointer relative whitespace-nowrap">
          {hasPermission(["all", "write"], userDetails) && (
            <>
              {isPage(obj) && (
                <button
                  className="inline-flex items-center gap-2 px-1.5 p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100"
                  onClick={() => {
                    openModal("pageGroupListModal", obj);
                  }}
                >
                  <Icon icon="hugeicons:move" className="w-6 h-6" />
                </button>
              )}
            </>
          )}

          {hasPermission(["all", "write"], userDetails) && (
            <button
              id={`dropdown-button-${obj.id}`}
              data-dropdown-toggle={`dropdown-${obj.id}`}
              className="inline-flex items-center gap-2 p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100"
              type="button"
            >
              <Link
                to={`/dashboard/documentation/edit-page?id=${docId}${pageGroupId ? `&pageGroupId=${pageGroupId}` : ""}&pageId=${obj.id}&versionId=${versionId}&version=${version}`}
              >
                <Icon
                  icon="material-symbols:edit-outline"
                  className="w-6 h-6 text-yellow-500 dark:text-yellow-400"
                />
              </Link>
            </button>
          )}

          {hasPermission(["all", "delete"], userDetails) && (
            <button
              id={`dropdown-button-${obj.id}`}
              data-dropdown-toggle={`dropdown-${obj.id}`}
              className="inline-flex items-center gap-2 p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100"
              type="button"
            >
              {isPage(obj) && (
                <Icon
                  icon="material-symbols:delete"
                  className="w-6 h-6 text-red-600 dark:text-red-500"
                  onClick={() => {
                    openModal("delete", obj);
                  }}
                />
              )}
            </button>
          )}
        </td>
      )}
    </AnimatedTableRow>
  );
});
