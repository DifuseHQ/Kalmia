import React, { useState } from "react";
import { toastError, toastSuccess, toastWarning } from "../../utlis/toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import instance from "../../api/AxiosInstance";
import { AnimatePresence, motion } from "framer-motion";

export default function UserResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPasswod, setConfirmPassword] = useState("");

  const [searchParam] = useSearchParams();
  const user_id = searchParam.get("user_id");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!password) {
      toastWarning("Enter new password");
      return;
    }

    if (password !== confirmPasswod) {
      toastWarning("Password and Confirm password miss match");
      return;
    }
    try {
      const response = await instance.post("/auth/user/edit", {
        id: Number(user_id),
        password: password.toString(),
      });
      if (response?.status === 200) {
        toastSuccess("password change successfully");
        navigate("/dashboard/user-profile");
      }
    } catch (err) {
      if(!err.response){
        toastError(err?.message);
        navigate('/server-down')
      }
      toastError(err?.response?.data?.message);
    }
  };

  const handleClose = () => {
    navigate("/dashboard/user-profile");
  };

  return (
    <AnimatePresence class="bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-auto lg:py-0"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          class="w-full p-6 bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md dark:bg-gray-800 dark:border-gray-700 sm:p-8"
        >
          <div class="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Reset Password
            </h3>
            <button
              onClick={handleClose}
              type="button"
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-toggle="defaultModal"
            >
              <svg
                aria-hidden="true"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
          </div>
          <form
            class="mt-4 space-y-4 lg:mt-5 md:space-y-5"
            onSubmit={handleChangePassword}
          >
            <div>
              <label
                htmlForfor="password"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                name="password"
                id="password"
                autoComplete="new-password"
                placeholder="••••••••"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required=""
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Confirm password
              </label>
              <input
                type="password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                name="confirm-password"
                id="confirm-password"
                autoComplete="new-password"
                placeholder="••••••••"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required=""
              />
            </div>

            <button
              type="submit"
              class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
            >
              Reset passwod
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
