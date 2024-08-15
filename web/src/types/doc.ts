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
  isPageGroup? : boolean;
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
  isPageGroup? : boolean;
  pageGroups: PageGroup[];
}

export interface Features {
  emoji:string,
  title:string,
  text:string
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
  features: Features;
}

export interface FooterLabelLinks {
  icon:string,
  link:string
}

export interface MoreLabelLinks {
  label:string,
  link:string
}

export interface Documentation {
  id: number;
  name: string;
  version: string;
  url: string;
  organizationName: string;
  projectName: string;
  landerDetails: LanderDetails;
  baseURL: string;
  clonedFrom: number | null;
  description: string;
  favicon: string;
  metaImage: string;
  navImage: string;
  navImageDark: string;
  customCSS: string;
  footerLabelLinks: FooterLabelLinks;
  moreLabelLinks: MoreLabelLinks;
  authorId: number;
  author: Author;
  createdAt: string;
  updatedAt: string;
  editors: Editor[];
  lastEditorId: number;
  pageGroups: PageGroup[];
  pages: Page[];
}
