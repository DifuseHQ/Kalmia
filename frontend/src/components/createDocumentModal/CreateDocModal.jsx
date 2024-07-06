import React, { useContext, useState } from "react";
import { ModalContext } from "../../App";
import {privateAxios} from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { toastError, toastSuccess, toastWarning } from "../../utlis/toast";
import { AnimatePresence, motion } from "framer-motion";
import { AuthContext } from "../../Context/AuthContext";

export default function CreateDocModal() {
  const { refreshData } = useContext(AuthContext);
  const navigate = useNavigate();
  const { isOpenModal, setIsOpenModal } = useContext(ModalContext);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCloseModal = () => {
    setIsOpenModal(false);
    navigate("/dashboard");
  };

  const handleCreateDocument = async () => {
    if (formData.title === "") {
      toastWarning("Title is required. Please enter a new Document Title.");
      return;
    }

    try {
      const { data, status } = await privateAxios.post(
        "/docs/documentation/create",
        {
          name: formData.title,
          description: formData.description,
        });

      if (status === 200) {
        setIsOpenModal(false);
        refreshData();
        navigate("/dashboard");
        toastSuccess(data.message);
      } else {
        console.log("error not added");
      }
    } catch (err) {
      toastError(err.response.data.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpenModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="relative p-4 w-full max-w-xl"
          >
            <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
              <div className="flex justify-between items-center mb-4 sm:mb-5 dark:border-gray-600">
                <div className="flex-grow text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Create Documentation
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  type="button"
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>

              <div className="grid gap-4 mb-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Title
                  </label>
                  <input
                    onChange={handleChange}
                    type="text"
                    name="title"
                    id="title"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Enter new document title"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Description
                  </label>
                  <div className="py-2">
                    <textarea
                      onChange={handleChange}
                      name="description"
                      id="description"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder="Description about your new document"
                      rows="3"
                    ></textarea>
                  </div>
                </div>
                <button
                  onClick={handleCreateDocument}
                  type="button"
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                >
                  Create
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
