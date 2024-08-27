import { Icon } from "@iconify/react/dist/iconify.js";
import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getPageGroups, updatePage, updatePageGroup } from "../../api/Requests";
import { AuthContext, AuthContextType } from "../../context/AuthContext";
import { ModalContext, ModalContextType } from "../../context/ModalContext";
import { PageGroup } from "../../types/doc";
import { getAllPageGroupNames, handleError } from "../../utils/Common";

export default function PageGroupListModal() {
  const { closeModal } = useContext(ModalContext) as ModalContextType;
  const authContext = useContext(AuthContext);
  const { refreshData } = authContext as AuthContextType;
  const { pageGroupListModal, currentModalItem } = useContext(ModalContext);
  const [data, setData] = useState<PageGroup[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!currentModalItem) return;

    const fetchData = async () => {
      const result = await getPageGroups();

      const filterData = result.data.filter(
        (val: PageGroup) =>
          val.documentationId === currentModalItem?.documentationId,
      );
      const allPageGroupNames = getAllPageGroupNames(filterData);

      const filteredData: PageGroup[] = allPageGroupNames.filter(
        (val: PageGroup) => {
          if (currentModalItem?.isPageGroup) {
            return (
              val.id !== currentModalItem.parentId &&
              val.id !== currentModalItem.id
            );
          } else {
            return val.id !== currentModalItem.pageGroupId;
          }
        },
      );
      setData(filteredData);
    };
    fetchData();
  }, [currentModalItem]);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const handleSearchVersionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredGroup = data.filter((val: PageGroup) =>
    val.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleUpdate = async (obj: PageGroup | null) => {
    let result;

    if (obj === null) {
      if (currentModalItem?.isPageGroup) {
        result = updatePageGroup({
          id: currentModalItem?.id || 0,
          name: currentModalItem?.name,
          documentationId: currentModalItem?.documentationId || 0,
          parentId: undefined,
        });
      } else {
        result = updatePage({
          id: currentModalItem?.id || 0,
          documentationId: currentModalItem?.documentationId || 0,
          title: currentModalItem?.title || "",
          slug: currentModalItem?.slug || "",
          content: "",
        });
      }
    } else {
      if (currentModalItem?.isPageGroup) {
        result = updatePageGroup({
          id: currentModalItem?.id || 0,
          name: currentModalItem?.name,
          documentationId: currentModalItem?.documentationId || 0,
          parentId: obj.id,
        });
      } else {
        result = updatePage({
          id: currentModalItem?.id || 0,
          documentationId: currentModalItem?.documentationId || 0,
          pageGroupId: obj.id,
          title: currentModalItem?.title || "",
          slug: currentModalItem?.slug || "",
          content: "",
        });
      }
    }

    if (handleError(await result, navigate, t)) return;

    if ((await result).status === "success") {
      closeModal("pageGroupListModal");
      refreshData();
    }
  };

  return (
    <>
      {pageGroupListModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative p-4 w-full max-w-md"
            >
              <div className="relative bg-white rounded-lg shadow dark:bg-gray-700 min-h-auto max-h-[100vh]">
                <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Move{" "}
                    {`"${currentModalItem?.name ? currentModalItem?.name : currentModalItem?.title}"`}{" "}
                    to
                  </h3>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      closeModal("pageGroupListModal");
                    }}
                    type="button"
                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm h-8 w-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                    data-modal-toggle="select-modal"
                  >
                    <Icon
                      icon="material-symbols:close"
                      className="w-6 h-6 text-black dark:text-white"
                    />
                    <span className="sr-only">Close modal</span>
                  </button>
                </div>
                <div className="p-4 md:p-5 h-full">
                  <div
                    id="dropdownSearch"
                    className="z-10 w-full bg-white rounded-lg shadow dark:bg-gray-700"
                  >
                    <div className="p-3">
                      <label htmlFor="input-group-search" className="sr-only">
                        Search
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
                          <Icon
                            icon="material-symbols-light:search"
                            className="h-6 w-6 dark:text-white text-gray-500"
                          />
                        </div>
                        <input
                          value={searchQuery}
                          onChange={handleSearchVersionChange}
                          type="text"
                          id="input-group-search"
                          className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          placeholder="Search user"
                        />
                      </div>
                    </div>
                    <ul
                      className="min-h-auto max-h-48 px-3 pb-3  overflow-y-auto text-sm text-gray-700 dark:text-gray-200"
                      aria-labelledby="dropdownSearchButton"
                    >
                      {filteredGroup.length > 0 ? (
                        <>
                          {(currentModalItem?.parentId ||
                            currentModalItem?.pageGroupId) && (
                            <li>
                              <div
                                onClick={() => handleUpdate(null)}
                                className="cursor-pointer flex items-center ps-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                <p className="w-full py-2 ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300">
                                  {t("root")}
                                </p>
                              </div>
                            </li>
                          )}

                          {filteredGroup.map(
                            (val: PageGroup, index: number) => (
                              <li key={index}>
                                <div
                                  onClick={() => handleUpdate(val)}
                                  className="cursor-pointer flex items-center ps-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                  <p className="w-full py-2 ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300">
                                    {val.name}
                                  </p>
                                </div>
                              </li>
                            ),
                          )}
                        </>
                      ) : (
                        <div className="cursor-pointer flex items-center ps-2 rounded">
                          <p className="w-full text-center py-2 ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300">
                            {t("no_search_found")}
                          </p>
                        </div>
                      )}
                    </ul>
                  </div>
                  <button className="text-white inline-flex w-full justify-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                    {t("move")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}
