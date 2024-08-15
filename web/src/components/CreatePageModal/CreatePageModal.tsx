import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ModalContext, ModalContextType } from "../../context/ModalContext";
import { DOMEvent } from "../../types/dom";

interface CreatePageProps {
  handleCreate: (title: string, slug: string) => void;
}

export default function CreatePage({ handleCreate }: CreatePageProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState<string>("");
  const [slug, setSlug] = useState<string>("");

  const generateSlug = (title: string): string => {
    return (
      "/" +
      title
        .toLowerCase()
        .trim()
        .replace(/[\s]+/g, "-")
        .replace(/[^\w-]+/g, "")
    );
  };

  const handleKeyDown = (event: DOMEvent) => {
    if ("key" in event && event.key === "Enter") {
      event.preventDefault();
      const generatedSlug = generateSlug(title);
      setSlug(generatedSlug);
      handleCreate(title, generatedSlug);
    }
  };

  const { closeModal } = useContext(ModalContext) as ModalContextType;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50"
        key="create-page-1"
      >
        <div className="relative p-4 w-full max-w-xl">
          <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
            <div className="flex justify-between items-center mb-4 sm:mb-5 dark:border-gray-600">
              <div className="flex-grow text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("new_page")}
                </h3>
              </div>
              <button
                onClick={() => closeModal("createPage")}
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
              >
                <Icon icon="material-symbols:close" className="w-6 h-6" />
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            <div className="grid gap-4 mb-4">
              <div>
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  {t("title_label")}
                </span>
                <input
                  ref={inputRef}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    console.log(e.target.value);

                    const newTitle = e.target.value;
                    setTitle(newTitle);
                    setSlug(generateSlug(newTitle));
                  }}
                  onKeyDown={handleKeyDown}
                  type="text"
                  name="title"
                  id="title"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder={t("title_page_placeholder")}
                  required
                />
              </div>
              <div>
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  {t("slug")}
                </span>
                <input
                  value={slug}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSlug(e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  type="text"
                  name="slug"
                  id="slug"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder={t("slug_placeholder")}
                  required
                />
              </div>
              <button
                onClick={() => handleCreate(title, slug)}
                type="button"
                className="flex justify-center items-center gap-1 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 w-full dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
              >
                <span>{t("new_page")}</span>
                <Icon icon="ei:plus" className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
