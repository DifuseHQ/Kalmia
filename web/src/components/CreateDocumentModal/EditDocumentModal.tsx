import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { ModalContext, ModalContextType } from "../../context/ModalContext";

interface EditDocumentModalProps {
  title?: string;
  updateData: (title: string, version: string, id: number) => void;
  id: number;
}

export default function EditDocumentModal({
  title,
  updateData,
  id,
}: EditDocumentModalProps) {
  const { t } = useTranslation();
  const [editTitle, setEditTitle] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const { closeModal, cloneDocumentModal } = useContext(
    ModalContext,
  ) as ModalContextType;

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  useEffect(() => {
    setEditTitle(title || "");
  }, [title, id]);

  const handleCloseClick = useCallback(() => {
    if (cloneDocumentModal) {
      closeModal("cloneDocument");
    } else {
      closeModal("edit");
    }
  }, [cloneDocumentModal, closeModal]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      updateData(editTitle, version, id);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    setter(e.target.value);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50"
        key="edit-documentation-container"
      >
        <div
          className="relative p-4 w-full max-w-xl"
          key="edit-documentation-container-0"
        >
          <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
            <div className="flex justify-between items-center mb-4 sm:mb-5 dark:border-gray-600">
              <div className="flex-grow text-center">
                <h3 className="text-lg  font-semibold text-gray-900 dark:text-white">
                  {cloneDocumentModal
                    ? t("new_document_version")
                    : t("rename_page_group")}
                </h3>
              </div>
              <button
                onClick={handleCloseClick}
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
              >
                <Icon icon="material-symbols:close" className="w-6 h-6" />
                <span className="sr-only">Close modal</span>
              </button>
            </div>

            {cloneDocumentModal ? (
              <div className="grid gap-4 mb-4">
                <div>
                  <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    {t("version_label")}
                  </span>
                  <input
                    ref={titleRef}
                    value={version}
                    onChange={(e) => handleInputChange(e, setVersion)}
                    onKeyDown={handleKeyDown}
                    type="text"
                    name="version"
                    id="version"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder={t("version_palceholder")}
                    required
                  />
                </div>
                <button
                  onClick={() => updateData(editTitle, version, id)}
                  type="button"
                  className="flex justify-center items-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                >
                  <span>{t("new_version")}</span>
                  <Icon icon="ei:plus" className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="grid gap-4 mb-4">
                {title && (
                  <div>
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      {t("title_label")}
                    </span>
                    <input
                      ref={titleRef}
                      value={editTitle}
                      onChange={(e) => handleInputChange(e, setEditTitle)}
                      onKeyDown={handleKeyDown}
                      type="text"
                      name="title"
                      id="title"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder={t("title_placeholder")}
                      required
                    />
                  </div>
                )}

                <button
                  onClick={() => updateData(editTitle, version, id)}
                  type="button"
                  className="flex justify-center items-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                >
                  <span>{t("update")}</span>
                  <Icon icon="ei:plus" className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
