import { Icon } from "@iconify/react";
import React, { ChangeEvent, JSX, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ApiResponse, createUser } from "../../api/Requests";
import { handleError } from "../../utils/Common";
import { toastMessage } from "../../utils/Toast";
import Breadcrumb from "../Breadcrumb/Breadcrumb";

interface UserData {
  username: string;
  password: string;
  email: string;
}

export default function CreateUser(): JSX.Element {
  const { t } = useTranslation();
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
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

          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("password")}
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
