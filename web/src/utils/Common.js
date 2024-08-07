import Cookies from "js-cookie";
import { DateTime } from "luxon";

import { toastMessage } from "./Toast";

let isRedirecting = false;
let lastToastMessage = "";
let lastToastTime = 0;

export const handleError = (result, navigate = null, t) => {
  if (result.status === "error") {
    if (
      result.code === 401 &&
      !isRedirecting &&
      window.location.pathname !== "/login"
    ) {
      isRedirecting = true;
      toastMessage(t(result.message), "error");
      Cookies.remove("accessToken");
      window.location.href = "/login";
      return true;
    } else if (result.code !== 401) {
      if (result?.data) {
        toastMessage(t(result?.data?.message), "error");
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

        if (navigate)
          navigate("/error", { state: { errorDetails: result || {} } });
      }
    }
    return true;
  }
  return false;
};

export const getFormattedDate = (date) => {
  try {
    const dt = DateTime.fromISO(date).setZone("local");
    return dt.toFormat("dd-MM-yy hh:mm a");
  } catch (error) {
    return date;
  }
};

export const getRandomString = (length) => {
  const randomChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length)
    );
  }
  return result;
};

export const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const isTokenExpiringSoon = async (data) => {
  const expiryDateString = data.expiry.replace(
    /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*/,
    "$1"
  );

  const expiryDate = new Date(expiryDateString);
  const currentTime = new Date();
  const timeDifference = expiryDate.getTime() - currentTime.getTime();
  const oneHourInMilliseconds = 60 * 60 * 1000;
  return timeDifference < oneHourInMilliseconds;
};

export const combinePages = (pageGroups, pages) => {
  let filteredGroups = [];
  let filteredPages = [];

  if (pageGroups.length > 0 && pages.length > 0) {
    filteredGroups = pageGroups.filter((obj) => !obj.parentId);
    filteredPages = pages.filter((obj) => !obj.pageGroupId);
  } else if (pageGroups.length > 0) {
    filteredGroups = pageGroups.filter((obj) => !obj.parentId);
  } else if (pages.length > 0) {
    filteredPages = pages.filter((obj) => !obj.pageGroupId);
  } else {
    return [];
  }

  return sortGroupAndPage(filteredGroups, filteredPages);
};

export const sortGroupAndPage = (filteredGroups, filteredPages) => {
  const combinedPages = [...filteredGroups, ...filteredPages];
  combinedPages.sort((a, b) => {
    const orderA =
      a.order !== null && a.order !== undefined ? a.order : Infinity;
    const orderB =
      b.order !== null && b.order !== undefined ? b.order : Infinity;

    if (orderA !== orderB) {
      return orderA - orderB;
    } else {
      return combinedPages.indexOf(a) - combinedPages.indexOf(b);
    }
  });

  return combinedPages;
};

export function getClosestVersion(cloneData) {
  const now = new Date();

  return cloneData.reduce((closest, obj) => {
    const createdAt = new Date(obj.createdAt);
    const timeDifference = Math.abs(now - createdAt);

    if (
      !closest ||
      timeDifference < Math.abs(now - new Date(closest.createdAt))
    ) {
      return {
        id: obj.id,
        version: obj.version,
        createdAt: obj.createdAt,
      };
    }
    return closest;
  }, null);
}

export function getVersion(cloneData, versionId) {
  const matchingObj = cloneData?.find((obj) => obj.id === Number(versionId));

  return matchingObj
    ? {
        id: matchingObj.id,
        version: matchingObj.version,
        createdAt: matchingObj.createdAt,
      }
    : null;
}

export function getLastPageOrder(data) {
  if (data.length > 0) {
    return data[data.length - 1].order + 1;
  }
  return 0;
}

export const isValidURL = (string) => {
  try {
    new URL(string); // eslint-disable-line no-new
    return true;
  } catch (err) {
    return false;
  }
};

function isValidBaseURL(baseURL) {
  if (!baseURL.startsWith("/")) {
    return false;
  }

  if (baseURL.includes("://") || baseURL.includes("www.")) {
    return false;
  }

  const validChars = /^[a-zA-Z0-9\/\-_\.]+$/; // eslint-disable-line no-useless-escape
  if (!validChars.test(baseURL)) {
    return false;
  }

  return true;
}

export const validateFormData = (formData) => {
  const errors = {
    status: false,
    message: "",
  };

  if (!formData.name) {
    errors.status = true;
    errors.message = "title_is_required";
    return errors;
  }

  if (!formData.version) {
    errors.status = true;
    errors.message = "version_is_required";
    return errors;
  }

  if (!formData.description) {
    errors.status = true;
    errors.message = "description_is_required";
    return errors;
  }

  if (!formData.customCSS) {
    errors.status = true;
    errors.message = "custom_css_is_required";
    return errors;
  }

  if (formData.favicon && !isValidURL(formData.favicon)) {
    errors.status = true;
    errors.message = "valid_favicon_url_required";
    return errors;
  }

  if (formData.navImage && !isValidURL(formData.navImage)) {
    errors.status = true;
    errors.message = "valid_navbar_icon_url_required";
    return errors;
  }

  if (!formData.copyrightText) {
    errors.status = true;
    errors.message = "copyright_text_is_required";
    return errors;
  }

  if (!isValidURL(formData.metaImage)) {
    errors.status = true;
    errors.message = "valid_social_image_url_required";
    return errors;
  }

  if (!formData.organizationName) {
    errors.status = true;
    errors.message = "organization_name_is_required";
    return errors;
  }

  if (!formData.projectName) {
    errors.status = true;
    errors.message = "project_name_is_required";
    return errors;
  }

  if (!isValidBaseURL(formData.baseURL)) {
    errors.status = true;
    errors.message = "valid_base_url_required";
    return errors;
  }

  if (!isValidURL(formData.url)) {
    errors.status = true;
    errors.message = "valid_url_required";
    return errors;
  }

  return errors;
};

export const validateCommunityFields = (socialPlatformField, moreField) => {
  const errors = {
    status: false,
    message: "",
  };

  for (const field of socialPlatformField) {
    if (!field.icon) {
      errors.status = true;
      errors.message = "social_media_icon_required";
      return errors;
    }
    if (!field.link || !isValidURL(field.link)) {
      errors.status = true;
      errors.message = "valid_social_platform_url_required";
      return errors;
    }
  }
  for (const field of moreField) {
    if (!field.label) {
      errors.status = true;
      errors.message = "more_field_label_required";
      return errors;
    }
    if (!field.link || !isValidURL(field.link)) {
      errors.status = true;
      errors.message = "valid_more_community_url_required";
      return errors;
    }
  }
  return errors;
};

export const landingPagevalidate = (data) => {
  const errors = {
    status: false,
    message: "",
  };

  if (!data.ctaButtonText.ctaButtonLinkLabel) {
    errors.status = true;
    errors.message = "CTA Button text is required";
    return errors;
  }

  if (
    data.ctaButtonText.ctaButtonLink &&
    !isValidURL(data.ctaButtonText.ctaButtonLink)
  ) {
    errors.status = true;
    errors.message = "Valid CTA Button Link required";
    return errors;
  }


  if (
    data.secondCtaButtonText.ctaButtonLink &&
    !isValidURL(data.secondCtaButtonText.ctaButtonLink)
  ) {
    errors.status = true;
    errors.message = "Valid second CTA Button Link required";
    return errors;
  }

  if (data.ctaImageLink && !isValidURL(data.ctaImageLink)) {
    errors.status = true;
    errors.message = "Valid CTA image url Required";
    return errors;
  }

  return errors;
};

export const prepareLandingPageData = (data) => {
  // Create a copy of the data
  let preparedData = { ...data };

  // Check if each field is empty and set it to an empty object if so
  if (
    !preparedData.ctaButtonText.ctaButtonLinkLabel &&
    !preparedData.ctaButtonText.ctaButtonLink &&
    !preparedData.secondCtaButtonText.ctaButtonLinkLabel &&
    !preparedData.secondCtaButtonText.ctaButtonLink &&
    !preparedData.ctaImageLink &&
    !preparedData.features.some(
      (feature) => feature.emoji || feature.title || feature.text
    )
  ) {
    preparedData = {};
  }

  return preparedData;
};
