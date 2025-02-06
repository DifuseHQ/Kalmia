import { Icon } from "@iconify/react";
import { useContext, useState } from "react";
import { ModalContext } from "../../context/ModalContext";
import {
  createDocumentation,
  DocumentationPayload,
  getDocumentations,
  importGitBook,
} from "../../api/Requests";
import { t } from "i18next";
import { customCSSInitial } from "../../utils/Utils";
import { toastMessage } from "../../utils/Toast";
import { useCreateBlockNote } from "@blocknote/react";
import {
  createPage as createPageAPI,
  createPageGroup as createPageGroupAPI,
} from "../../api/Requests";
import { useNavigate } from "react-router-dom";

export default function GitBookModal() {
  interface GitBookDetails {
    username: string;
    password: string;
    url: string;
  }
  interface CurrentObj {
    [key: string]: string | CurrentObj;
  }

  const { closeModal, openModal } = useContext(ModalContext);
  const editor = useCreateBlockNote();
  const [details, setDetails] = useState<GitBookDetails>({
    username: "",
    password: "",
    url: "",
  });

  const navigate = useNavigate();

  const slugCount: Record<string, number> = {};

  const generateSlug = (title: string): string => {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, "-")
      .replace(/[^\w-]+/g, "");
    if (slugCount[baseSlug] !== undefined) {
      slugCount[baseSlug]++;
      return `/${baseSlug}-${slugCount[baseSlug]}`;
    } else {
      slugCount[baseSlug] = 0;
      return `/${baseSlug}`;
    }
  };

  async function parsedContent(content: string): Promise<string> {
    const parsedContent = await editor.tryParseHTMLToBlocks(content);
    return JSON.stringify(parsedContent, null, 2);
  }

  function processContent(
    obj: CurrentObj,
    docId: number | null = null,
    parentId: number | null = null
  ) {
    async function createPage(
      title: string,
      content: string,
      pageGroupId: number | null = null,
      order: number
    ) {
      const createPagePayload = {
        title,
        slug: generateSlug(title),
        content: await parsedContent(content),
        documentationId: Number(docId),
        order,
        pageGroupId: Number(pageGroupId) ?? undefined,
      };

      await createPageAPI(createPagePayload);
    }

    async function createPageGroup(
      title: string,
      parentId: number | null = null,
      order: number
    ): Promise<number> {
      const createPageGroupPayload = {
        name: title,
        documentationId: Number(docId),
        order,
        ...(parentId !== null ? { parentId: Number(parentId) } : {}),
      };

      const result = await createPageGroupAPI(createPageGroupPayload);
      return result.data.id;
    }

    async function traverseObject(
      currentObj: CurrentObj,
      currentParentId: number | null = null,
      order: number = 1
    ) {
      for (const [key, value] of Object.entries(currentObj)) {
        if (typeof value === "object" && value !== null) {
          if (!key.endsWith(".md")) {
            const newPageGroupId = await createPageGroup(
              key,
              currentParentId,
              order++
            );
            await traverseObject(value, newPageGroupId, order);
          }
        } else if (typeof value === "string" && key.endsWith(".md")) {
          await createPage(key, value, currentParentId, order++);
        }
      }
    }

    traverseObject(obj, parentId, 1);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let docId: number | null = null;

    closeModal("gitBookModal");
    openModal("loadingModal", null);

    try {
      const res = await importGitBook(details);
      if (res.status === "error") {
        toastMessage(t(`${res.data.message}`), "error");
        closeModal("loadingModal");
        return;
      }

      const docs = (await getDocumentations()).data;
      const largestId =
        docs.length > 0
          ? Math.max(...docs.map((doc: DocumentationPayload) => doc.id))
          : 0;

      const payload: DocumentationPayload = {
        id: null,
        name: `gitbook-import-${largestId + 1}`,
        version: "1.0.0",
        url: "http://localhost:2727",
        organizationName: "N/A",
        projectName: "N/A",
        landerDetails: "",
        baseURL: `/gitbook-import-${largestId + 1}`,
        description: "N/A",
        favicon: "https://downloads-bucket.difuse.io/favicon-final-kalmia.ico",
        metaImage: "https://difuse.io/assets/images/meta/meta.webp",
        navImage:
          "https://downloads-bucket.difuse.io/kalmia-sideways-black.png",
        navImageDark:
          "https://downloads-bucket.difuse.io/kalmia-sideways-white-final.png",
        customCSS: customCSSInitial(),
        copyrightText: "N/A",
      };

      const createResponse = await createDocumentation(payload);
      docId = createResponse.data.id;
      processContent(JSON.parse(res.data), docId);

      closeModal("loadingModal");
      navigate(`/dashboard/edit-documentation?id=${docId}&mode=edit`);

      toastMessage(t("documentation_created"), "success");
    } catch (error) {
      closeModal("loadingModal");
      toastMessage(t("error_creating_documentation"), "error");
    }
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
                  id="gitbookURL"
                  placeholder="https://git.difuse.io/Difuse/gitbook-export-example"
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
                  className="w-full flex justify-center items-center text-white bg-blue-700 hover:bg-blue-800  font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 "
                >
                  <Icon icon="mdi:import" className="w-6 h-6" /> {t("import")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
