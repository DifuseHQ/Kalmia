import { Icon } from "@iconify/react";
import React, { ChangeEvent, JSX, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ApiResponse, createUser, UserPayload } from "../../api/Requests";
import { formatRole, handleError, permissionList } from "../../utils/Common";
import { toastMessage } from "../../utils/Toast";
import Breadcrumb from "../Breadcrumb/Breadcrumb";

export const requiredField = () => <span className="text-red-500 mx-1">*</span>;

export default function CreateUser(): JSX.Element {
  const { t } = useTranslation();
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [dropdown, setDropdown] = useState<boolean>(false);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!permissions) {
      toastMessage(t("Please select role"), "warning");
      return;
    }

    if (password.length < 8) {
      toastMessage(t("password_must_be_at_least_8_characters"), "warning");
      return;
    }

    if (password !== confirmPassword) {
      toastMessage(t("password_and_confirm_password_do_not_match"), "warning");
      return;
    }

    const userData: UserPayload = {
      username,
      password,
      email,
      permissions: permissions || [],
      admin: permissions.length == 1 && permissions[0] === "all" ? true : false,
    };

    const result: ApiResponse = await createUser(userData);

    if (result.status === "success") {
      toastMessage(t("user_created_successfully"), "success");
      navigate("/dashboard/admin/user-list");
    } else {
      handleError(result, navigate, t);
    }
  };

  const handleDropdown = () => {
    setDropdown(!dropdown);
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

            <div className="relative space-y-2">
              <button
                onClick={handleDropdown}
                className="text-black border border-gray-400 bg-white dark:border-none dark:text-white hover:bg-gray-300 font-medium rounded-lg text-sm px-5 py-1.5 text-center inline-flex items-center dark:bg-gray-600 dark:hover:bg-gray-700"
                type="button"
              >
                {formatRole(permissions || [])}
                <svg
                  className="w-2.5 h-2.5 ms-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              {dropdown && (
                <div className="absolute right-0 lg:left-0 bg-white rounded-lg shadow w-52 dark:bg-gray-700 z-30">
                  <ul
                    className="text-sm overflow-hidden rounded-lg text-gray-700 dark:text-gray-200"
                    aria-labelledby="dropdownInformationButton"
                  >
                    {permissionList.map((obj, index) => (
                      <li
                        className="bg-red-500"
                        key={index}
                        onClick={() => {
                          setPermissions(obj.value);
                          handleDropdown();
                        }}
                      >
                        <p
                          className={`cursor-pointer block px-4 py-2  hover:bg-gray-100 dark:hover:bg-gray-500 dark:hover:text-white
              ${permissions && permissions === obj.value ? "bg-gray-700" : "bg-gray-600"}
              `}
                        >
                          {obj?.name}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
