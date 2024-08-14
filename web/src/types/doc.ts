export interface Author {
  email: string;
  id: number;
  username: string;
}

export interface Editor {
  email: string;
  id: number;
  username: string;
}

export interface Page {
  id: number;
  authorId: number;
  author: Author;
  documentationId: number;
  pageGroupId?: number;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  order: number;
  editors: Editor[];
  lastEditorId: number;
  isIntroPage?: boolean;
  content?: string;
}

export interface PageGroup {
  author: Author;
  createdAt: string;
  documentationId: number;
  editors: Editor[];
  id: number;
  lastEditorId: number;
  name: string;
  order: number;
  pages: Page[];
  parentId: number | null;
  updatedAt: string;
}

export interface Documentation {
  id: number;
  name: string;
  version: string;
  url: string;
  organizationName: string;
  projectName: string;
  landerDetails: string;
  baseURL: string;
  clonedFrom: number | null;
  description: string;
  favicon: string;
  metaImage: string;
  navImage: string;
  navImageDark: string;
  customCSS: string;
  footerLabelLinks: string;
  moreLabelLinks: string;
  authorId: number;
  author: Author;
  createdAt: string;
  updatedAt: string;
  editors: Editor[];
  lastEditorId: number;
  pageGroups: PageGroup[];
  pages: Page[];
}
