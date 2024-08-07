import instance, { makeRequestWithCustomAuth } from './AxiosInstance';

const ERROR_MESSAGES = {
  500: ['Internal Server Error', '/505'],
  404: ['Not Found', '/404'],
  401: ['Unauthorized', '/401']
};

function getMessageAndPath (statusCode) {
  return ERROR_MESSAGES[statusCode] || ['Unknown Error', '/error'];
}

async function makeRequest (url, method = 'get', data = null) {
  try {
    const response = await instance[method](url, data);
    return {
      status: 'success',
      code: response.status,
      data: response.data,
      message: '',
      path: ''
    };
  } catch (error) {
    const statusCode = error?.response?.status || 500;
    const errorData = error?.response?.data || null;
    const [message, path] = getMessageAndPath(statusCode);
    return {
      status: 'error',
      code: statusCode,
      data: errorData,
      message,
      path
    };
  }
}

export const createJWT = (data) =>
  makeRequest('/auth/jwt/create', 'post', data);
export const refreshJWT = (token) =>
  makeRequest('/auth/jwt/refresh', 'post', { token });
export const validateJWT = (token) => {
  return makeRequestWithCustomAuth('/auth/jwt/validate', 'post', token)
    .then((response) => ({
      status: 'success',
      code: response.status,
      data: response.data,
      message: '',
      path: ''
    }))
    .catch((error) => {
      const statusCode = error?.response?.status || 500;
      const errorData = error?.response?.data || null;
      const [message, path] = getMessageAndPath(statusCode);
      return {
        status: 'error',
        code: statusCode,
        data: errorData,
        message,
        path
      };
    });
};

export const signOut = (token) =>
  makeRequest('/auth/jwt/revoke', 'post', { token });

export const getDocumentations = () => makeRequest('/docs/documentations');
export const getDocumentation = (id) =>
  makeRequest('/docs/documentation', 'post', { id });
export const createDocumentation = (data) =>
  makeRequest('/docs/documentation/create', 'post', data);
export const updateDocumentation = (data) =>
  makeRequest('/docs/documentation/edit', 'post', data);
export const deleteDocumentation = (id) =>
  makeRequest('/docs/documentation/delete', 'post', { id });
export const createDocumentationVersion = (data) =>
  makeRequest('/docs/documentation/version', 'post', data);
export const buildTrigger = () => makeRequest('/health/last-trigger');

export const getPageGroups = () => makeRequest('/docs/page-groups');
export const getPageGroup = (id) =>
  makeRequest('/docs/page-group', 'post', { id });
export const createPageGroup = (data) =>
  makeRequest('/docs/page-group/create', 'post', data);
export const updatePageGroup = (data) =>
  makeRequest('/docs/page-group/edit', 'post', data);
export const deletePageGroup = (id) =>
  makeRequest('/docs/page-group/delete', 'post', { id });

export const getPages = () => makeRequest('/docs/pages');
export const getPage = (id) => makeRequest('/docs/page', 'post', { id });
export const updatePage = (data) =>
  makeRequest('/docs/page/edit', 'post', data);
export const createPage = (data) =>
  makeRequest('/docs/page/create', 'post', data);
export const deletePage = (id) =>
  makeRequest('/docs/page/delete', 'post', { id });

export const commonReorderBulk = (data) =>
  makeRequest('/docs/documentation/reorder-bulk', 'post', data);

export const getUsers = () => makeRequest('/auth/users');
export const getUser = (id) =>
  makeRequest('/auth/user', 'post', { id: Number.parseInt(id) });
export const createUser = (data) =>
  makeRequest('/auth/user/create', 'post', data);
export const updateUser = (data) =>
  makeRequest('/auth/user/edit', 'post', data);
export const uploadPhoto = (data) =>
  makeRequest('auth/user/upload-photo', 'post', data);
export const deleteUser = (username) =>
  makeRequest('auth/user/delete', 'post', { username });
export const oAuthProviders = () => makeRequest('/oauth/providers');
