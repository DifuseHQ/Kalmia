import { Icon } from "@iconify/react/dist/iconify.js";
import { motion } from "framer-motion";
import { type JSX, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  getDocumentations,
  getPageGroups,
  getPages,
  getUser,
} from "../../api/Requests";
import { AuthContext } from "../../context/AuthContext";
import type { Documentation, Page, PageGroup } from "../../types/doc";
import { toastMessage } from "../../utils/Toast";
import { getRootParentIdFromChildId } from "../../utils/Common";

interface BreadcrumbItem {
  title: string;
  path: string;
  icon: string;
}

export default function Breadcrumb(): JSX.Element {
  const { id: userIdFromParam } = useParams<{ id: string }>();
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [searchParams] = useSearchParams();

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext)!;
  const titleRef = useRef<string>("");

  const { t } = useTranslation();

  useEffect(() => {
    async function updateBreadcrumb() {
      const newBreadcrumb: BreadcrumbItem[] = [];

      if (location.pathname.includes("/dashboard/user-profile")) {
        newBreadcrumb.push({
          title: "User Profile",
          path: "/dashboard/user-profile",
          icon: "mdi:account-circle",
        });

        setBreadcrumb(newBreadcrumb);
        return;
      }

      if (location.pathname.includes("/dashboard/admin")) {
        newBreadcrumb.push({
          title: "User Management",
          path: "/dashboard/admin/user-list",
          icon: "mdi:users",
        });

        if (location.pathname.includes("/create-user")) {
          newBreadcrumb.push({
            title: "Create User",
            path: "/dashboard/admin/create-user",
            icon: "mdi:account-plus",
          });
        } else if (location.pathname.includes("/user-list")) {
          newBreadcrumb.push({
            title: "User List",
            path: "/dashboard/admin/user-list",
            icon: "mdi:table-user",
          });
        } else if (location.pathname.includes("/edit-user")) {
          if (user?.admin) {
            const userData = await getUser(parseInt(userIdFromParam!));
            newBreadcrumb.push({
              title: `${userData.data.username}`,
              path: location.pathname + location.search,
              icon: "mdi:account-edit",
            });
          }
        }

        setBreadcrumb(newBreadcrumb);
        return;
      }

      const [documentations, pageGroups, pages] = await Promise.all(
        [getDocumentations(), getPageGroups(), getPages()].map(
          async (promise) => {
            const result = await promise;
            if (result.status === "error") {
              throw new Error(result.message);
            }
            return result.data;
          },
        ),
      ).catch((error: Error) => {
        toastMessage(t(error.message), "error");
        return [null, null, null];
      });

      newBreadcrumb.push({
        title: "Dashboard",
        path: "/dashboard",
        icon: "uiw:home",
      });

      const docId = searchParams.get("id");
      const pageId = searchParams.get("pageId");
      const pageGroupId = searchParams.get("pageGroupId");
      const isCreatePage = location.pathname.includes("/create-page");
      const versionId = searchParams.get("versionId");
      const version = searchParams.get("version");
      const clonedFrom =
        versionId && version
          ? documentations?.find(
              (d: Documentation) =>
                Number.parseInt(d.id.toString()) === Number.parseInt(versionId),
            )?.clonedFrom
          : null;

      if (clonedFrom !== null) {
        const parentDocId: number = (versionId) ? (await getRootParentIdFromChildId(parseInt(versionId))) : (await getRootParentIdFromChildId(parseInt(docId!)));
        const doc = documentations?.find(
          (d: Documentation) =>
            Number.parseInt(d.id.toString()) === Number.parseInt(versionId!),
        );
        newBreadcrumb.push({
          title: doc?.name || "",
          path: `/dashboard/documentation?id=${parentDocId}&versionId=${doc?.id}&version=${doc?.version}`,
          icon: "uiw:document",
        });
      } else if (
        location.pathname.includes("/create-documentation") ||
        location.pathname.includes("/edit-documentation")
      ) {
        if (location.pathname.includes("/create-documentation")) {
          newBreadcrumb.push({
            title: "Create Documentation",
            path: "/dashboard/create-documentation",
            icon: "pajamas:doc-new",
          });
        } else {
          const doc = documentations?.find(
            (d: Documentation) => d.id === Number.parseInt(docId!),
          );
          if (doc) {
            newBreadcrumb.push({
              title: doc.name,
              path: `/dashboard/documentation?id=${doc.id}&versionId=${doc.id}&version=${doc.version}`,
              icon: "uiw:document",
            });
          }
          newBreadcrumb.push({
            title: "Edit Documentation",
            path: "/dashboard/edit-documentation",
            icon: "lucide:edit",
          });
        }
      } else {
        if (docId) {
          const doc = documentations?.find(
            (d: Documentation) => d.id === Number.parseInt(docId),
          );
          if (doc) {
            newBreadcrumb.push({
              title: doc.name,
              path: `/dashboard/documentation?id=${doc.id}&versionId=${doc.id}&version=${doc.version}`,
              icon: "uiw:document",
            });
          }
        } else {
          const smallestId = await documentations?.reduce(
            (min: number, doc: Documentation) => (doc.id < min ? doc.id : min),
            documentations[0]?.id,
          );
          navigate(
            smallestId
              ? `/dashboard/documentation?id=${smallestId}`
              : "/dashboard/documentation",
          );
        }
      }

      if (isCreatePage) {
        if (pageGroupId) {
          addPageGroupsBreadcrumb(
            Number.parseInt(pageGroupId),
            pageGroups,
            newBreadcrumb,
            versionId,
            version,
          );
        }
        newBreadcrumb.push({
          title: "Create Page",
          path: location.pathname + location.search,
          icon: "mdi:file-document-plus",
        });
      } else if (location.pathname.includes("/edit-page") && pageId) {
        const page = pages?.find((p: Page) => p.id === Number.parseInt(pageId));
        if (page) {
          if (page.pageGroupId != null && page.pageGroupId !== undefined) {
            addPageGroupsBreadcrumb(
              page.pageGroupId,
              pageGroups,
              newBreadcrumb,
              versionId,
              version,
            );
          }
          newBreadcrumb.push({
            title: page.title,
            path: `/dashboard/documentation/edit-page?id=${page.documentationId}&pageId=${page.id}&versionId=${versionId}&version=${version}`,
            icon: "iconoir:page",
          });
        }
      } else if (location.pathname.includes("/page-group") && pageGroupId) {
        addPageGroupsBreadcrumb(
          Number.parseInt(pageGroupId),
          pageGroups,
          newBreadcrumb,
          versionId,
          version,
        );
      }

      setBreadcrumb(newBreadcrumb);
    }

    function addPageGroupsBreadcrumb(
      pageGroupId: number,
      pageGroups: PageGroup[],
      newBreadcrumb: BreadcrumbItem[],
      versionId: string | null,
      version: string | null,
    ) {
      function findPageGroup(
        groups: PageGroup[],
        id: number,
      ): PageGroup | null {
        for (const group of groups) {
          if (group.id === id) return group;
          if (group.pageGroups) {
            const found = findPageGroup(group.pageGroups, id);
            if (found) return found;
          }
        }
        return null;
      }

      function buildBreadcrumb(
        group: PageGroup,
        versionId: string | null,
        version: string | null,
      ) {
        if (group.parentId) {
          const parent = findPageGroup(pageGroups, group.parentId);
          if (parent) buildBreadcrumb(parent, versionId, version);
        }
        newBreadcrumb.push({
          title: group.name,
          path: `/dashboard/documentation/page-group?id=${group.documentationId}&pageGroupId=${group.id}&versionId=${versionId}&version=${version}`,
          icon: "clarity:folder-solid",
        });
      }

      const pageGroup = findPageGroup(pageGroups, pageGroupId);
      if (!pageGroup) {
        return;
      }

      buildBreadcrumb(pageGroup, versionId, version);
    }

    updateBreadcrumb();
  }, [
    location.search,
    navigate,
    location.pathname,
    searchParams,
    user,
    userIdFromParam,
    setBreadcrumb,
    t,
  ]);

  useEffect(() => {
    const firstTitle = breadcrumb[0]?.title || "Kalmia";
    const lastTitle = breadcrumb[breadcrumb.length - 1]?.title || "";

    const newTitle =
      breadcrumb.length === 1
        ? `Kalmia - ${firstTitle}`
        : `${firstTitle} - ${lastTitle}`;

    titleRef.current = newTitle;

    document.title = titleRef.current;
  }, [breadcrumb]);

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mb-5"
      aria-label="Breadcrumb"
      key="breadcrumb-fin"
    >
      <ol className="flex flex-wrap items-center gap-y-2" key="breadcrum-list">
        {breadcrumb.map((crumb, index) => (
          <li key={`breadcrumb-${index}`} className="flex items-center">
            <Link
              to={crumb.path}
              className="flex items-center text-sm md:text-base font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white whitespace-nowrap py-1"
            >
              <Icon
                icon={crumb.icon}
                className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 flex-shrink-0"
              />
              <span className="truncate max-w-[150px] md:max-w-[200px]">
                {crumb.title}
              </span>
            </Link>
            {index !== breadcrumb.length - 1 && (
              <Icon
                icon="mingcute:right-fill"
                className="text-gray-500 mx-1 md:mx-2 flex-shrink-0"
              />
            )}
          </li>
        ))}
      </ol>
    </motion.nav>
  );
}
