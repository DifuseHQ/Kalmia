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
  isPage: boolean;
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
  parentId?: number | null;
  updatedAt: string;
  isPageGroup: boolean;
  pageGroups: PageGroup[];
}

export type PageOrGroup = PageGroup | Page;

export interface Features {
  emoji: string;
  title: string;
  text: string;
}

export interface LanderDetails {
  ctaButtonText: {
    ctaButtonLinkLabel: string;
    ctaButtonLink: string;
  };
  secondCtaButtonText: {
    ctaButtonLinkLabel: string;
    ctaButtonLink: string;
  };
  ctaImageLink: string;
  features: Features[];
}

export interface FooterLabelLinks {
  icon: string;
  link: string;
}

export interface MoreLabelLinks {
  label: string;
  link: string;
}

export interface Documentation {
  id: number;
  name: string;
  version: string;
  url: string;
  organizationName: string;
  projectName: string;
  landerDetails?: LanderDetails;
  baseURL: string;
  clonedFrom: number | null;
  description: string;
  favicon: string;
  metaImage: string;
  navImage: string;
  navImageDark: string;
  customCSS: string;
  footerLabelLinks?: FooterLabelLinks[];
  moreLabelLinks?: MoreLabelLinks[];
  authorId: number;
  author: Author;
  createdAt: string;
  updatedAt: string;
  editors?: Editor[];
  lastEditorId: number;
  pageGroups?: PageGroup[];
  pages?: Page[];
  copyrightText: string;
  requireAuth?: boolean;
  gitUser: string;
  gitRepo: string;
  gitEmail: string;
  gitPassword: string;
  gitBranch: string;
}

export interface FormField {
  label: string;
  placeholder: string;
  value: string;
  onChange: () => Promise<void>;
  name: string;
  type: string;
  required: boolean;
  ref: React.RefObject<HTMLInputElement>;
}

export interface FormFieldData {
  label: string;
  placeholder: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  type?: string;
  required?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}

export interface UploadFormField {
  label: string;
  placeholder: string;
  value: string;
  onChange: () => Promise<void>;
  name: string;
  type: string;
  required: boolean;
  ref: React.RefObject<HTMLInputElement>;
}
export interface UploadFormFieldData {
  label: string;
  placeholder: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  required?: boolean;
  uploaded?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}

export interface FormData {
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
  gitUser: string | undefined;
  gitRepo: string | undefined;
  gitEmail: string | undefined;
  gitPassword: string | undefined;
  gitBranch: string | undefined;
}

export function isPage(item: PageOrGroup): item is Page {
  return (item as Page).title !== undefined;
}

export function isPageGroup(item: PageOrGroup): item is PageGroup {
  return (item as PageGroup).name !== undefined;
}
