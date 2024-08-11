import { AxiosError, AxiosResponse } from 'axios';

import instance, { makeRequestWithCustomAuth } from './AxiosInstance';

interface ErrorMessages {
  [key: number]: [string, string];
}

interface ApiResponse {
  status: 'success' | 'error';
  code: number;
  data: any;
  message: string;
  path: string;
}

const ERROR_MESSAGES: ErrorMessages = {
  500: ['Internal Server Error', '/505'],
  404: ['Not Found', '/404'],
  401: ['Unauthorized', '/401']
};

function getMessageAndPath (statusCode: number): [string, string] {
  return ERROR_MESSAGES[statusCode] || ['Unknown Error', '/error'];
}

async function makeRequest (url: string, method: string = 'get', data: any = null): Promise<ApiResponse> {
  try {
    const response: AxiosResponse = await instance[method](url, data);
    return {
      status: 'success',
      code: response.status,
      data: response.data,
      message: '',
      path: ''
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    const statusCode = axiosError?.response?.status || 500;
    const errorData = axiosError?.response?.data || null;
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

export const createJWT = (data: any) =>
  makeRequest('/auth/jwt/create', 'post', data);

export const refreshJWT = (token: string) =>
  makeRequest('/auth/jwt/refresh', 'post', { token });

export const validateJWT = async (token: string): Promise<ApiResponse> => {
  try {
    const response: AxiosResponse = await makeRequestWithCustomAuth('/auth/jwt/validate', 'post', token);
    return {
      status: 'success' as const,
      code: response.status,
      data: response.data,
      message: '',
      path: ''
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    const statusCode = axiosError?.response?.status || 500;
    const errorData = axiosError?.response?.data || null;
    const [message, path] = getMessageAndPath(statusCode);
    return {
      status: 'error' as const,
      code: statusCode,
      data: errorData,
      message,
      path
    };
  }
};

export const signOut = (token: string) =>
  makeRequest('/auth/jwt/revoke', 'post', { token });

export const getDocumentations = () => makeRequest('/docs/documentations');

export const getDocumentation = (id: number | string) =>
  makeRequest('/docs/documentation', 'post', { id });

export const createDocumentation = (data: any) =>
  makeRequest('/docs/documentation/create', 'post', data);

export const updateDocumentation = (data: any) =>
  makeRequest('/docs/documentation/edit', 'post', data);

export const deleteDocumentation = (id: number | string) =>
  makeRequest('/docs/documentation/delete', 'post', { id });

export const createDocumentationVersion = (data: any) =>
  makeRequest('/docs/documentation/version', 'post', data);

export const buildTrigger = () => makeRequest('/health/last-trigger');

export const getPageGroups = () => makeRequest('/docs/page-groups');

export const getPageGroup = (id: number | string) =>
  makeRequest('/docs/page-group', 'post', { id });

export const createPageGroup = (data: any) =>
  makeRequest('/docs/page-group/create', 'post', data);

export const updatePageGroup = (data: any) =>
  makeRequest('/docs/page-group/edit', 'post', data);

export const deletePageGroup = (id: number | string) =>
  makeRequest('/docs/page-group/delete', 'post', { id });

export const getPages = () => makeRequest('/docs/pages');

export const getPage = (id: number | string) => makeRequest('/docs/page', 'post', { id });

export const updatePage = (data: any) =>
  makeRequest('/docs/page/edit', 'post', data);

export const createPage = (data: any) =>
  makeRequest('/docs/page/create', 'post', data);

export const deletePage = (id: number | string) =>
  makeRequest('/docs/page/delete', 'post', { id });

export const commonReorderBulk = (data: any) =>
  makeRequest('/docs/documentation/reorder-bulk', 'post', data);

export const getUsers = () => makeRequest('/auth/users');

export const getUser = (id: number | string) =>
  makeRequest('/auth/user', 'post', { id: Number.parseInt(id.toString()) });

export const createUser = (data: any) =>
  makeRequest('/auth/user/create', 'post', data);

export const updateUser = (data: any) =>
  makeRequest('/auth/user/edit', 'post', data);

export const uploadPhoto = (data: any) =>
  makeRequest('/auth/user/upload-photo', 'post', data);

export const deleteUser = (username: string) =>
  makeRequest('/auth/user/delete', 'post', { username });

export const oAuthProviders = () => makeRequest('/oauth/providers');
