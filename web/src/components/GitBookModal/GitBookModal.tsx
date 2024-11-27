import { Icon } from "@iconify/react";
import { useContext, useState } from "react";
import { ModalContext } from "../../context/ModalContext";
import { importGitBook } from "../../api/Requests";
import { t } from "i18next";

export default function GitBookModal() {
  const { closeModal } = useContext(ModalContext);

  const [details, setDetails] = useState({
    username: "",
    password: "",
    url: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submit");
    console.log(details);

    const res = await importGitBook(details);
    console.log("res", res);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
      <div className="relative p-4 w-full max-w-md max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="flex items-center justify-between px-4 py-2 md:px- md:py-25 rounded-t ">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Import GitBook
            </h3>
            <button
              onClick={() => closeModal("gitBookModal")}
              type="button"
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-hide="authentication-modal"
            >
              <Icon
                icon="line-md:close"
                className="w-5 h-5 text-gray-900 dark:text-white "
              />
            </button>
          </div>
          <div className="p-4 md:p-4">
            <form className="space-y-4" action="#" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {t("username")}
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  placeholder="name@company.com"
                  value={details.username}
                  onChange={(e) => {
                    setDetails({ ...details, username: e.target.value });
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {t("password")}
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  value={details.password}
                  onChange={(e) => {
                    setDetails({ ...details, password: e.target.value });
                  }}
                />
              </div>{" "}
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {t("url")} <span className="text-red-500 ">*</span>
                </label>
                <input
                  type="url"
                  name="gitBookurl"
                  id="password"
                  placeholder="https://github.com/example/ExampleDocumentation"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  required
                  value={details.url}
                  onChange={(e) => {
                    setDetails({ ...details, url: e.target.value });
                  }}
                />
              </div>
              <div className="flex justify-between gap-3">
                <button
                  onClick={() => closeModal("gitBookModal")}
                  className="w-full  dark:text-white   focus:outline-none  font-medium rounded-lg text-sm px-5 py-2.5 text-center border border-gary-400 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500 "
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="w-full flex items-center text-white bg-blue-700 hover:bg-blue-800  font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 "
                >
                  <Icon icon="ei:plus" className="w-6 h-6" /> {t("new_gitbook")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
