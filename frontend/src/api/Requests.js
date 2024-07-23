import instance from './AxiosInstance';

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
    console.error(error);
    const statusCode = error.response?.status || 500;
    const [message, path] = getMessageAndPath(statusCode);
    return {
      status: 'error',
      code: statusCode,
      data: null,
      message,
      path
    };
  }
}

export const refreshJWT = (token) => makeRequest('/auth/jwt/refresh', 'post', { token });
export const validateJWT = (token) => makeRequest('/auth/jwt/validate', 'post', { token });
export const signOut = (token) => makeRequest('/auth/jwt/revoke', 'post', { token });

export const getDocumentations = () => makeRequest('/docs/documentations');
export const getDocumentation = (id) => makeRequest('/docs/documentation', 'post', { id });
export const createDocumentation = (data) => makeRequest('/docs/documentation/create', 'post', data);
export const updateDocumentation = (data) => makeRequest('/docs/documentation/edit', 'post', data);
export const deleteDocumentation = (id) => makeRequest('/docs/documentation/delete', 'post', { id });
export const getPageGroups = () => makeRequest('/docs/page-groups');
export const getPageGroup = (id) => makeRequest('/docs/page-group', 'post', { id });
export const createPageGroup = (data) => makeRequest('/docs/page-group/create', 'post', data);
export const updatePageGroup = (data) => makeRequest('/docs/page-group/edit', 'post', data);
export const deletePageGroup = (id) => makeRequest('/docs/page-group/delete', 'post', { id });

export const getPages = () => makeRequest('/docs/pages');
export const getPage = (id) => makeRequest('/docs/page', 'post', { id });
export const updatePage = (data) => makeRequest('/docs/page/edit', 'post', data);
export const createPage = (data) => makeRequest('/docs/page/create', 'post', data);
export const deletePage = (id) => makeRequest('/docs/page/delete', 'post', { id });

export const getUsers = () => makeRequest('/auth/users');
export const createUser = (data) => makeRequest('/auth/user/create', 'post', data);
export const updateUser = (data) => makeRequest('/auth/user/edit', 'post', data);
export const uploadPhoto = (data) => makeRequest('auth/user/upload-photo', 'post', data);
