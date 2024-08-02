import Cookies from 'js-cookie';
import { DateTime } from 'luxon';

import { toastMessage } from './Toast';

export const handleError = (result, navigate = null, t) => {
  if (result.status === 'error') {
    if (result.status.code === '401') {
      toastMessage(t(result.message), 'error');
      Cookies.remove('accessToken');
      navigate('/login');
    } else {
      if (result?.data) {
        toastMessage(t(result?.data?.message), 'error');
      } else {
        toastMessage(t(result.message), 'error');
        navigate('/server-down');
      }
    }
    return true;
  }

  return false;
};

export const getFormattedDate = (date) => {
  try {
    const dt = DateTime.fromISO(date).setZone('local');
    return dt.toFormat('dd-MM-yy hh:mm a');
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
    const orderA = (a.order !== null && a.order !== undefined) ? a.order : Infinity;
    const orderB = (b.order !== null && b.order !== undefined) ? b.order : Infinity;

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

    if (!closest || timeDifference < Math.abs(now - new Date(closest.createdAt))) {
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
  const matchingObj = cloneData.find(obj => obj.id === Number(versionId));

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

export const isValidURL = (urlString) => {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

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

  if (formData.favicon && !isValidURL(formData.favicon)) {
    errors.status = true;
    errors.message = 'valid_favicon_url_required';
    return errors;
  }

  if (formData.navImage && !isValidURL(formData.navImage)) {
    errors.status = true;
    errors.message = 'valid_navbar_icon_url_required';
    return errors;
  }

  if (formData.metaImage && !isValidURL(formData.metaImage)) {
    errors.status = true;
    errors.message = 'valid_social_image_url_required';
    return errors;
  }

  return errors;
};

export const validateCommunityFields = (footerField, moreField) => {
  const errors = {
    status: false,
    message: ''
  };
  for (const field of footerField) {
    if (field.link && !isValidURL(field.link)) {
      errors.status = true;
      errors.message = 'valid_footer_community_url_required';
      return errors;
    }
  }
  for (const field of moreField) {
    if (field.link && !isValidURL(field.link)) {
      errors.status = true;
      errors.message = 'valid_more_community_url_required';
      return errors;
    }
  }
  return errors;
};
