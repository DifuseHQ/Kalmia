import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toastError, toastSuccess } from "../../utlis/toast";
import instance from "../../api/AxiosInstance";

export default function CreateUser() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    rePassword: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.rePassword) {
      toastError("Password and Confirm Password do not match");
      return;
    }
    console.log(formData);

    try {
      const response = await instance.post("/auth/user/create", {
        username: formData.username,
        password: formData.password,
        email: formData.email,
      });
      if (response?.status === 200) {
        toastSuccess("User Created Successfully");
        navigate("/dashboard/admin/user-list");
      }
    } catch (err) {
      console.error(err);
      toastError(err?.response?.data?.message);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5"
      >
        <div className="mx-auto max-w-screen-xl px-4 lg:px-12">
          <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4">
              <div className="w-full md:w-full">
                <form onSubmit={handleSubmit}>
                  <div className="overflow-x-auto">
                    <div className="relative p-4 w-full max-w-2xl h-full md:h-auto">
                      <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
                        <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
                          <h3 className="text-lg text-center font-semibold text-gray-900 dark:text-white">
                            Add user
                          </h3>
                          <Link
                            to="/dashboard/admin/user-list"
                            className="flex items-center justify-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
                          >
                            back
                          </Link>
                        </div>

                        <div className="grid gap-4 mb-4 ">
                          <div>
                            <label
                              htmlFor="username"
                              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                              Username
                            </label>
                            <input
                              type="text"
                              name="username"
                              id="username"
                              value={formData.username}
                              onChange={handleChange}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                              placeholder="Enter username"
                              required
                              autoComplete="username"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="email"
                              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                              placeholder="Enter email"
                              required
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="password"
                              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                              Password
                            </label>
                            <input
                              type="password"
                              name="password"
                              id="password"
                              value={formData.password}
                              onChange={handleChange}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                              placeholder="Enter password"
                              required
                              autoComplete="new-password"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="re-password"
                              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                              Confirm Password
                            </label>
                            <input
                              type="password"
                              name="rePassword"
                              id="re-password"
                              value={formData.rePassword}
                              onChange={handleChange}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                              placeholder="Re-enter password"
                              required
                              autoComplete="new-password"
                            />
                          </div>
                        </div>
                        <div className="flex justify-center my-5">
                          <button
                            type="submit"
                            className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                          >
                            Create user
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
