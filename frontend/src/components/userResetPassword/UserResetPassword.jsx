import React, { useState } from "react";
import { toastError, toastSuccess, toastWarning } from "../../utlis/toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import instance from "../../Context/AxiosInstance";

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
      const { data, status } = await instance.post("/auth/user/dit", {
        id: Number(user_id),
        password: password.toString(),
      });
      if (status === 200) {
        toastSuccess("password change successfullt");
        navigate("/user-profile");
      }
    } catch (err) {
      console.error(err);
      toastError(err.response.data.message)
    }
  };

  return (
    <section class="bg-gray-50 dark:bg-gray-900">
      <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-auto lg:py-0">
        <div class="w-full p-6 bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md dark:bg-gray-800 dark:border-gray-700 sm:p-8">
          <h2 class="mb-1 text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
            Change Password
          </h2>
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
        </div>
      </div>
    </section>
  );
}
