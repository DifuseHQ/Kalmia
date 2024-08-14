import { AxiosError, AxiosResponse, Method } from 'axios';

import instance, { makeRequestWithCustomAuth } from './AxiosInstance';

interface ErrorMessages {
  [key: number]: [string, string];
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  code: number;
  data: T | null;
  message: string;
  path: string;
}

interface AuthCredentials {
  username: string;
  password: string;
}

interface DocumentationPayload {
  id: number;
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
  landerDetails: string;
  footerLabelLinks: string;
}

interface CreateVersionPayload {
  originalDocId: number;
  version: string;
}

interface PageGroupPayload {
  name: string;
  documentationId: number;
  parentId: number;
  id?: number;
  order?: number;
}

interface PagePayload {
  title: string;
  slug: string;
  content: string;
  id: number;
}

interface OrderItem {
  id: number;
  order: number;
  documentationId?: number;
  parentId?: number;
  pageGroupId?: number;
  isPageGroup?: boolean;
}

interface ReorderBulkDataPayload {
  order: OrderItem[];
}

interface UserPayload {
  username: string;
  email: string;
  password: string;
}

interface UpdateUserPayload {
  id: number;
  photo?: string;
  username?: string;
  email?: string;
  password?: string;
}

const ERROR_MESSAGES: ErrorMessages = {
  500: ['Internal Server Error', '/505'],
  404: ['Not Found', '/404'],
  401: ['Unauthorized', '/401']
};

function getMessageAndPath (statusCode: number): [string, string] {
  return ERROR_MESSAGES[statusCode] || ['Unknown Error', '/error'];
}

async function makeRequest<T = any> (
  url: string,
  method: Method = 'get',
  data: any = null
): Promise<ApiResponse<T>> {
  try {
    let response: AxiosResponse<T>;

    switch (method.toLowerCase()) {
    case 'get':
      response = await instance.get<T>(url, { params: data });
      break;
    case 'post':
      response = await instance.post<T>(url, data);
      break;
    case 'put':
      response = await instance.put<T>(url, data);
      break;
    case 'delete':
      response = await instance.delete<T>(url, { data });
      break;
    case 'patch':
      response = await instance.patch<T>(url, data);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

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
      data: errorData as T | null,
      message,
      path
    };
  }
}

export const createJWT = (data: AuthCredentials): Promise<ApiResponse> => makeRequest('/auth/jwt/create', 'post', data);

export const refreshJWT = (token: string | null): Promise<ApiResponse> =>
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

export const signOut = (token: string | null): Promise<ApiResponse> =>
  makeRequest('/auth/jwt/revoke', 'post', { token });

export const getDocumentations = () => makeRequest('/docs/documentations');

export const getDocumentation = (id: number) =>
  makeRequest('/docs/documentation', 'post', { id });

export const createDocumentation = (data: DocumentationPayload) =>
  makeRequest('/docs/documentation/create', 'post', data);

export const updateDocumentation = (data: DocumentationPayload) =>
  makeRequest('/docs/documentation/edit', 'post', data);

export const deleteDocumentation = (id: number) =>
  makeRequest('/docs/documentation/delete', 'post', { id });

export const createDocumentationVersion = (data: CreateVersionPayload) =>
  makeRequest('/docs/documentation/version', 'post', data);

export const buildTrigger = () => makeRequest('/health/last-trigger');
export const getPageGroups = () => makeRequest('/docs/page-groups');

export const getPageGroup = (id: number) =>
  makeRequest('/docs/page-group', 'post', { id });

export const createPageGroup = (data: PageGroupPayload) =>
  makeRequest('/docs/page-group/create', 'post', data);

export const updatePageGroup = (data: PageGroupPayload) =>
  makeRequest('/docs/page-group/edit', 'post', data);

export const deletePageGroup = (id: number) =>
  makeRequest('/docs/page-group/delete', 'post', { id });

export const getPages = () => makeRequest('/docs/pages');

export const getPage = (id: number) => makeRequest('/docs/page', 'post', { id });

export const createPage = (data: PagePayload) =>
  makeRequest('/docs/page/create', 'post', data);

export const updatePage = (data: PagePayload) =>
  makeRequest('/docs/page/edit', 'post', data);

export const deletePage = (id: number) =>
  makeRequest('/docs/page/delete', 'post', { id });

export const commonReorderBulk = (data: ReorderBulkDataPayload) =>
  makeRequest('/docs/documentation/reorder-bulk', 'post', data);

export const getUsers = () => makeRequest('/auth/users');

export const getUser = (id: number) =>
  makeRequest('/auth/user', 'post', { id: Number.parseInt(id.toString()) });

export const createUser = (data: UserPayload) =>
  makeRequest('/auth/user/create', 'post', data);

export const updateUser = (data: UpdateUserPayload) =>
  makeRequest('/auth/user/edit', 'post', data);

export const uploadPhoto = (data: FormData) =>
  makeRequest('/auth/user/upload-photo', 'post', data);

export const deleteUser = (username: string) =>
  makeRequest('/auth/user/delete', 'post', { username });

export const oAuthProviders = async (): Promise<string[]> => {
  const response = await makeRequest<string[]>('/oauth/providers');
  if (response.status === 'success') {
    return response.data as string[];
  } else {
    throw new Error(`Error fetching OAuth providers: ${response.message}`);
  }
};