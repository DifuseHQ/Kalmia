import { Icon } from "@iconify/react";
import React, { ChangeEvent, JSX, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ApiResponse, createUser } from "../../api/Requests";
import { handleError, role } from "../../utils/Common";
import { toastMessage } from "../../utils/Toast";
import Breadcrumb from "../Breadcrumb/Breadcrumb";

interface UserData {
  username: string;
  password: string;
  email: string;
}

export const requiredField = () => <span className="text-red-500 mx-1">*</span>;

export default function CreateUser(): JSX.Element {
  const { t } = useTranslation();
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [permissions, setPermissions] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // if(permissions === ""){
    //   toastMessage(t("Please select role"), "warning");
    //   return;
    // }

    if (password.length < 8) {
      toastMessage(t("password_must_be_at_least_8_characters"), "warning");
      return;
    }

    if (password !== confirmPassword) {
      toastMessage(t("password_and_confirm_password_do_not_match"), "warning");
      return;
    }

    const userData: UserData = {
      username,
      password,
      email,
    };

    const result: ApiResponse = await createUser(userData);

    if (result.status === "success") {
      toastMessage(t("user_created_successfully"), "success");
      navigate("/dashboard/admin/user-list");
    } else {
      handleError(result, navigate, t);
    }
  };

  return (
    <div className="w-full mx-auto">
      <Breadcrumb />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {t("create_new_user")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("username")}
              {requiredField()}
            </span>
            <input
              type="text"
              id="username"
              ref={inputRef}
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
              className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("email_address")}
              {requiredField()}
            </span>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="flex gap-10 items-center">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 ">
              {t("role")}
              {requiredField()}
            </span>

            <div className="flex">
              {role.map((val) => (
                <div className="flex items-center me-4" key={val}>
                  <input
                    id="inline-checkbox"
                    checked={permissions === val.toLowerCase()}
                    onChange={(e) => setPermissions(e.target.value)}
                    type="checkbox"
                    value={val.toLowerCase()}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor="inline-checkbox"
                    className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    {t(`${val}`)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("password")}
              {requiredField()}
            </span>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("confirm_password")}
              {requiredField()}
            </span>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-start space-x-4">
            <button
              type="submit"
              className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition duration-300 flex items-center"
            >
              <span className="mr-2">{t("create_user")}</span>
              <Icon icon="ei:plus" className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/admin/user-list")}
              className="bg-gray-500 text-white rounded-md px-4 py-2 hover:bg-gray-600 transition duration-300"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
