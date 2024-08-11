import { useEffect } from 'react';

import { toastMessage } from './Toast';

let isRedirecting = false;
let lastToastMessage = '';
let lastToastTime = 0;

export const handleError = (result, navigate = null, t) => {
  if (result.status === 'error') {
    if (
      result.code === 401 &&
      !isRedirecting &&
      window.location.pathname !== '/login'
    ) {
      isRedirecting = true;
      toastMessage(t(result.message), 'error');
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return true;
    } else if (result.code !== 401) {
      if (result?.data) {
        toastMessage(t(result?.data?.message), 'error');
      } else {
        const currentTime = Date.now();
        const message = t(result.message);

        if (
          message !== lastToastMessage ||
          currentTime - lastToastTime > 1000
        ) {
          toastMessage(message, 'error');
          lastToastMessage = message;
          lastToastTime = currentTime;
        }

        if (navigate) {
          navigate('/error', { state: { errorDetails: result || {} } });
        }
      }
    }
    return true;
  }
  return false;
};

export const getFormattedDate = (date) => {
  try {
    const dt = new Date(date);
    if (isNaN(dt.getTime())) throw new Error('Invalid date');

    const day = dt.getDate().toString().padStart(2, '0');
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const year = dt.getFullYear().toString().slice(-2);
    const hours = dt.getHours() % 12 || 12;
    const minutes = dt.getMinutes().toString().padStart(2, '0');
    const ampm = dt.getHours() >= 12 ? 'PM' : 'AM';

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  } catch (error) {
    return date;
  }
};

export const getRandomString = (length) => {
  const randomChars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
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
    '$1'
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
      a.order !== null && a.order !== undefined
        ? a.order
        : Number.POSITIVE_INFINITY;
    const orderB =
      b.order !== null && b.order !== undefined
        ? b.order
        : Number.POSITIVE_INFINITY;

    if (orderA !== orderB) {
      return orderA - orderB;
    } else {
      return combinedPages.indexOf(a) - combinedPages.indexOf(b);
    }
  });

  return combinedPages;
};

export function getClosestVersion (cloneData) {
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
        createdAt: obj.createdAt
      };
    }
    return closest;
  }, null);
}

export function getVersion (cloneData, versionId) {
  const matchingObj = cloneData?.find((obj) => obj.id === Number(versionId));

  return matchingObj
    ? {
      id: matchingObj.id,
      version: matchingObj.version,
      createdAt: matchingObj.createdAt
    }
    : null;
}

export function getLastPageOrder (data) {
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

function isValidBaseURL (baseURL) {
  const invalidBaseURLs = [
    'admin',
    '/admin',
    '/admin/',
    '/docs',
    '/auth',
    '/oauth',
    '/health'
  ];

  for (const invalidBaseURL of invalidBaseURLs) {
    if (baseURL.startsWith(invalidBaseURL)) {
      return false;
    }
  }

  if (!baseURL) {
    return false;
  }

  if (baseURL.includes('://') || baseURL.includes('www.')) {
    return false;
  }

  const validChars = /^[a-zA-Z0-9\/\-_\.]+$/; // eslint-disable-line no-useless-escape
  if (!validChars.test(baseURL)) {
    return false;
  }

  if (baseURL.length === 1 && baseURL === '/') {
    return false;
  }

  return true;
}

export const validateFormData = (formData) => {
  const errors = {
    status: false,
    message: ''
  };

  if (!formData.name) {
    errors.status = true;
    errors.message = 'title_is_required';
    return errors;
  }

  if (!formData.version) {
    errors.status = true;
    errors.message = 'version_is_required';
    return errors;
  }

  if (!formData.description) {
    errors.status = true;
    errors.message = 'description_is_required';
    return errors;
  }

  if (!formData.customCSS) {
    errors.status = true;
    errors.message = 'custom_css_is_required';
    return errors;
  }

  if (formData.favicon && !isValidURL(formData.favicon)) {
    errors.status = true;
    errors.message = 'valid_favicon_url_required';
    return errors;
  }

  if (formData.navImageDark && !isValidURL(formData.navImageDark)) {
    errors.status = true;
    errors.message = 'valid_navbar_icon_url_required';
    return errors;
  }

  if (formData.navImage && !isValidURL(formData.navImage)) {
    errors.status = true;
    errors.message = 'valid_navbar_icon_url_required';
    return errors;
  }

  if (!formData.copyrightText) {
    errors.status = true;
    errors.message = 'copyright_text_is_required';
    return errors;
  }

  if (!isValidURL(formData.metaImage)) {
    errors.status = true;
    errors.message = 'valid_social_image_url_required';
    return errors;
  }

  if (!formData.organizationName) {
    errors.status = true;
    errors.message = 'organization_name_is_required';
    return errors;
  }

  if (!formData.projectName) {
    errors.status = true;
    errors.message = 'project_name_is_required';
    return errors;
  }

  if (!isValidBaseURL(formData.baseURL)) {
    errors.status = true;
    errors.message = 'valid_base_url_required';
    return errors;
  }

  if (!isValidURL(formData.url)) {
    errors.status = true;
    errors.message = 'valid_url_required';
    return errors;
  }

  return errors;
};

export const validateCommunityFields = (socialPlatformField, moreField) => {
  const errors = {
    status: false,
    message: ''
  };

  for (const field of socialPlatformField) {
    if (field.link && !field.icon) {
      errors.status = true;
      errors.message = 'social_media_icon_required';
      return errors;
    }
    if ((field.icon && !field.link) || (field.link && !isValidURL(field.link))) {
      errors.status = true;
      errors.message = 'valid_social_platform_url_required';
      return errors;
    }
  }
  for (const field of moreField) {
    if (field.link && !field.label) {
      errors.status = true;
      errors.message = 'more_field_label_required';
      return errors;
    }
    if ((field.label && !field.link) || (field.link && !isValidURL(field.link))) {
      errors.status = true;
      errors.message = 'valid_more_community_url_required';
      return errors;
    }
  }
  return errors;
};

export const landingPagevalidate = (data) => {
  const errors = {
    status: false,
    message: ''
  };

  if (!data.ctaButtonText.ctaButtonLinkLabel) {
    errors.status = true;
    errors.message = 'CTA Button text is required';
    return errors;
  }

  if (
    (!data.ctaButtonText.ctaButtonLink ||
    !isValidURL(data.ctaButtonText.ctaButtonLink)) &&
    !isValidBaseURL(data.ctaButtonText.ctaButtonLink)
  ) {
    errors.status = true;
    errors.message = 'Valid CTA Button Link required';
    return errors;
  }

  if (
    data.secondCtaButtonText.ctaButtonLink &&
    !isValidURL(data.secondCtaButtonText.ctaButtonLink) &&
    !isValidBaseURL(data.ctaButtonText.ctaButtonLink)
  ) {
    errors.status = true;
    errors.message = 'Valid second CTA Button Link required';
    return errors;
  }

  if (!data.ctaImageLink || !isValidURL(data.ctaImageLink)) {
    errors.status = true;
    errors.message = 'Valid CTA image url Required';
    return errors;
  }

  return errors;
};

export function useOutsideAlerter (ref, onOutsideClick) {
  useEffect(() => {
    function handleClickOutside (event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClick();
      }
    }

    function handleEscapeKey (event) {
      if (event.key === 'Escape') {
        onOutsideClick();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [ref, onOutsideClick]);
}

export const convertToEmoji = (codePoint) => {
  if (/^[0-9a-fA-F]+$/.test(codePoint)) {
    return String.fromCodePoint(Number.parseInt(codePoint, 16));
  } else {
    return '';
  }
};
