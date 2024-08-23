import { TFunction } from "i18next";
import { RefObject, useEffect } from "react";

import { ApiResponse, getRootParentId, OrderItem } from "../api/Requests";
import { ValidatedJWT } from "../types/auth";
import { Documentation, Page, PageGroup } from "../types/doc";
import { toastMessage } from "./Toast";

let isRedirecting: boolean = false;
let lastToastMessage: string = "";
let lastToastTime: number = 0;

interface ValidationResult {
  status: boolean;
  message: string;
}

interface LandingPage {
  ctaButtonText: {
    ctaButtonLinkLabel: string;
    ctaButtonLink: string;
  };
  secondCtaButtonText: {
    ctaButtonLinkLabel: string;
    ctaButtonLink: string;
  };
  ctaImageLink: string;
  features: Array<{
    emoji: string;
    title: string;
    text: string;
  }>;
}

interface SocialPlatformField {
  icon: string;
  link: string;
}

interface MoreField {
  label: string;
  link: string;
}

interface CreateDocumentFormData {
  name: string;
  description: string;
  version: string;
  baseURL: string;
  url: string;
  organizationName: string;
  projectName: string;
  customCSS: string;
  favicon: string;
  navImageDark: string;
  navImage: string;
  copyrightText: string;
  metaImage: string;
}

interface ClosestVersion {
  id: number;
  version: string;
  createdAt: string;
}

type NavigateFunction = (path: string, options?: { state?: unknown }) => void;

export const handleError = (
  result: ApiResponse,
  navigate: NavigateFunction | null = null,
  t: TFunction,
): boolean => {
  if (result.status === "error") {
    if (
      result.code === 401 &&
      !isRedirecting &&
      window.location.pathname !== "/login" &&
      window.location.pathname !== "/admin/login"
    ) {
      console.log(result);
      alert("Session expired. Please login again.");
      isRedirecting = true;
      toastMessage(t(result.message), "error");
      localStorage.removeItem("accessToken");

      window.location.reload();

      return true;
    } else if (result.code !== 401) {
      if (result.data) {
        toastMessage(t(result.data.message), "error");
      } else {
        const currentTime = Date.now();
        const message = t(result.message);
        if (
          message !== lastToastMessage ||
          currentTime - lastToastTime > 1000
        ) {
          toastMessage(message, "error");
          lastToastMessage = message;
          lastToastTime = currentTime;
        }
        if (navigate) {
          navigate("/error", { state: { errorDetails: result } });
        }
      }
    }
    return true;
  }
  return false;
};

export const getFormattedDate = (date: string | number | Date): string => {
  try {
    const dt = new Date(date);
    if (isNaN(dt.getTime())) throw new Error("Invalid date");

    const day = dt.getDate().toString().padStart(2, "0");
    const month = (dt.getMonth() + 1).toString().padStart(2, "0");
    const year = dt.getFullYear().toString().slice(-2);
    const hours = dt.getHours() % 12 || 12;
    const minutes = dt.getMinutes().toString().padStart(2, "0");
    const ampm = dt.getHours() >= 12 ? "PM" : "AM";

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(date);
  }
};

export const getRandomString = (length: number): string => {
  const randomChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length),
    );
  }
  return result;
};

export const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const isTokenExpiringSoon = async (
  data: ValidatedJWT,
): Promise<boolean> => {
  const expiryDateString = data.expiry.replace(
    /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*/,
    "$1",
  );

  const expiryDate = new Date(expiryDateString);
  const currentTime = new Date();
  const timeDifference = expiryDate.getTime() - currentTime.getTime();
  const oneHourInMilliseconds = 60 * 60 * 1000;
  return timeDifference < oneHourInMilliseconds;
};

export const combinePages = (
  pageGroups: PageGroup[],
  pages: Page[],
): (PageGroup | Page)[] => {
  let filteredGroups: PageGroup[] = [];
  let filteredPages: Page[] = [];

  if (pageGroups.length > 0 && pages.length > 0) {
    filteredGroups = pageGroups.filter((obj: PageGroup) => !obj.parentId);
    filteredPages = pages.filter((obj: Page) => !obj.pageGroupId);
  } else if (pageGroups.length > 0) {
    filteredGroups = pageGroups.filter((obj: PageGroup) => !obj.parentId);
  } else if (pages.length > 0) {
    filteredPages = pages.filter((obj: Page) => !obj.pageGroupId);
  } else {
    return [];
  }

  return sortGroupAndPage(filteredGroups, filteredPages);
};

export const sortGroupAndPage = (
  filteredGroups: PageGroup[],
  filteredPages: Page[],
): (PageGroup | Page)[] => {
  const combinedPages: (PageGroup | Page)[] = [
    ...filteredGroups,
    ...filteredPages,
  ];

  combinedPages.sort((a, b) => {
    const orderA = "order" in a ? a.order : Number.POSITIVE_INFINITY;
    const orderB = "order" in b ? b.order : Number.POSITIVE_INFINITY;

    if (orderA !== orderB) {
      return orderA - orderB;
    } else {
      return combinedPages.indexOf(a) - combinedPages.indexOf(b);
    }
  });

  return combinedPages;
};

export function getClosestVersion(
  cloneData: Documentation[],
): ClosestVersion | null {
  const now = new Date();

  return cloneData.reduce(
    (closest: ClosestVersion | null, obj: Documentation) => {
      const createdAt = new Date(obj.createdAt);

      if (isNaN(createdAt.getTime())) {
        console.warn(`Invalid date for object with id ${obj.id}`);
        return closest;
      }

      const timeDifference = Math.abs(now.getTime() - createdAt.getTime());

      if (
        !closest ||
        timeDifference <
          Math.abs(now.getTime() - new Date(closest.createdAt).getTime())
      ) {
        return {
          id: obj.id,
          version: obj.version,
          createdAt: obj.createdAt,
        };
      }

      return closest;
    },
    null,
  );
}

export function getVersion(
  cloneData: Documentation[],
  versionId: number,
): ClosestVersion | null {
  const matchingObj = cloneData?.find(
    (obj: Documentation) => obj.id === versionId,
  );

  return matchingObj
    ? {
        id: matchingObj.id,
        version: matchingObj.version,
        createdAt: matchingObj.createdAt,
      }
    : null;
}

export function getLastPageOrder(data: (PageGroup | Page)[]) {
  if (data.length > 0) {
    return data[data.length - 1].order + 1;
  }
  return 0;
}

export const isValidURL = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    console.error("Error validating URL:", err);
    return false;
  }
};

function isValidBaseURL(baseURL: string) {
  const invalidBaseURLs = [
    "admin",
    "/admin",
    "/admin/",
    "/docs",
    "/auth",
    "/oauth",
    "/health",
  ];

  for (const invalidBaseURL of invalidBaseURLs) {
    if (baseURL.startsWith(invalidBaseURL)) {
      return false;
    }
  }

  if (!baseURL) {
    return false;
  }

  if (baseURL.includes("://") || baseURL.includes("www.")) {
    return false;
  }

  const validChars = /^[a-zA-Z0-9\/\-_\.]+$/; // eslint-disable-line no-useless-escape
  if (!validChars.test(baseURL)) {
    return false;
  }

  if (baseURL.length === 1 && baseURL === "/") {
    return false;
  }

  return true;
}

export const validateFormData = (
  formData: CreateDocumentFormData,
): ValidationResult => {
  const requiredFields: (keyof CreateDocumentFormData)[] = [
    "name",
    "version",
    "description",
    "customCSS",
    "copyrightText",
    "organizationName",
    "projectName",
  ];

  for (const field of requiredFields) {
    if (!formData[field]) {
      return { status: true, message: `${field}_is_required` };
    }
  }

  const urlFields: (keyof CreateDocumentFormData)[] = [
    "favicon",
    "navImageDark",
    "navImage",
    "metaImage",
  ];

  for (const field of urlFields) {
    if (formData[field] && !isValidURL(formData[field])) {
      return { status: true, message: `valid_${field}_url_required` };
    }
  }

  if (!isValidBaseURL(formData.baseURL)) {
    return { status: true, message: "valid_base_url_required" };
  }

  if (!isValidURL(formData.url)) {
    return { status: true, message: "valid_url_required" };
  }

  return { status: false, message: "" };
};

export const validateCommunityFields = (
  socialPlatformField: SocialPlatformField[],
  moreField: MoreField[],
): { status: boolean; message: string } => {
  const errors = {
    status: false,
    message: "",
  };

  for (const field of socialPlatformField) {
    if (field.link && !field.icon) {
      errors.status = true;
      errors.message = "social_media_icon_required";
      return errors;
    }
    if (
      (field.icon && !field.link) ||
      (field.link && !isValidURL(field.link))
    ) {
      errors.status = true;
      errors.message = "valid_social_platform_url_required";
      return errors;
    }
  }
  for (const field of moreField) {
    if (field.link && !field.label) {
      errors.status = true;
      errors.message = "more_field_label_required";
      return errors;
    }
    if (
      (field.label && !field.link) ||
      (field.link && !isValidURL(field.link))
    ) {
      errors.status = true;
      errors.message = "valid_more_community_url_required";
      return errors;
    }
  }
  return errors;
};

export const landingPageValidate = (
  data: LandingPage,
): { status: boolean; message: string } => {
  const checks = [
    {
      condition: !data.ctaButtonText.ctaButtonLinkLabel,
      message: "CTA Button text is required",
    },
    {
      condition:
        !isValidURL(data.ctaButtonText.ctaButtonLink) &&
        !isValidBaseURL(data.ctaButtonText.ctaButtonLink),
      message: "Valid CTA Button Link required",
    },
    {
      condition:
        data.secondCtaButtonText.ctaButtonLink &&
        !isValidURL(data.secondCtaButtonText.ctaButtonLink) &&
        !isValidBaseURL(data.ctaButtonText.ctaButtonLink),
      message: "Valid second CTA Button Link required",
    },
    {
      condition: !data.ctaImageLink || !isValidURL(data.ctaImageLink),
      message: "Valid CTA image url Required",
    },
  ];

  for (const check of checks) {
    if (check.condition) {
      return { status: true, message: check.message };
    }
  }

  return { status: false, message: "" };
};

export function useOutsideAlerter(
  ref: RefObject<HTMLElement>,
  onOutsideClick: () => void,
): void {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    }

    function handleEscapeKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onOutsideClick();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [ref, onOutsideClick]);
}

export const convertToEmoji = (codePoint: string): string => {
  if (/^[0-9a-fA-F]+$/.test(codePoint)) {
    return String.fromCodePoint(Number.parseInt(codePoint, 16));
  } else {
    return "";
  }
};

export const isPageGroup = (item: PageGroup | Page): item is PageGroup => {
  return "name" in item;
};

export const createOrderItems = (
  items: Array<PageGroup | Page>,
): OrderItem[] => {
  const pageGroups: OrderItem[] = [];
  const pages: OrderItem[] = [];

  items.forEach((item, index) => {
    if (isPageGroup(item)) {
      pageGroups.push({
        id: item.id,
        order: index,
        parentId: item?.parentId,
        isPageGroup: true,
      });
    } else {
      pages.push({
        id: item.id,
        order: index,
        pageGroupId: item?.pageGroupId,
        isPageGroup: false,
      });
    }
  });

  return [...pageGroups, ...pages];
};

export const getRootParentIdFromChildId = async (
  childId: number,
): Promise<number> => {
  const rootId = await getRootParentId(childId);
  if (rootId.data?.rootParentId) {
    return rootId.data.rootParentId;
  }

  return 1;
};
