import React, { createContext, ReactNode, useState } from "react";

export interface ModalItem {
  id: number;
  name?: string /* Documentation || Page group */;
  title?: string /* For Page */;
  version?: string;
  username?: string;
  slug?: string;
  documentationId?: number;
  parentId?: number | null | undefined;
  pageGroupId?: number | null | undefined;
  isPageGroup?: boolean;
  isPage?: boolean;
}

export interface ModalContextType {
  createDocumentationModal: boolean;
  createPageGroupModal: boolean;
  createPageModal: boolean;
  editModal: boolean;
  deleteModal: boolean;
  cloneDocumentModal: boolean;
  currentModalItem: ModalItem | null;
  pageSizeDropdown: boolean;
  loadingModal: boolean;
  pageGroupListModal: boolean;
  loadingMessage: string;
  gitBookModal: boolean;
  setCurrentModalItem: React.Dispatch<React.SetStateAction<ModalItem | null>>;
  setLoadingModal: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingMessage: React.Dispatch<React.SetStateAction<string>>;
  openModal: (modalName: string, item: ModalItem | null) => void;
  closeModal: (modalName: string) => void;
}

const defaultContext: ModalContextType = {
  createDocumentationModal: false,
  createPageGroupModal: false,
  createPageModal: false,
  editModal: false,
  deleteModal: false,
  pageGroupListModal: false,
  cloneDocumentModal: false,
  currentModalItem: null,
  pageSizeDropdown: false,
  loadingModal: false,
  loadingMessage: "Loading..",
  gitBookModal: false,
  setCurrentModalItem: () => {},
  setLoadingModal: () => {},
  setLoadingMessage: () => {},
  openModal: () => {},
  closeModal: () => {},
};

export const ModalContext = createContext<ModalContextType>(defaultContext);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [createDocumentationModal, setCreateDocumentationModal] =
    useState(false);
  const [createPageGroupModal, setCreatePageGroupModal] = useState(false);
  const [createPageModal, setCreatePageModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [cloneDocumentModal, setCloneDocumentModal] = useState(false);
  const [pageGroupListModal, SetPageGroupListModal] = useState(false);
  const [gitBookModal, setGitBookModal] = useState(false);
  const [currentModalItem, setCurrentModalItem] = useState<ModalItem | null>(
    null
  );
  const [pageSizeDropdown, setpageSizeDropdown] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading..");

  const openModal = (modalName: string, item: ModalItem | null) => {
    setCurrentModalItem(item);
    switch (modalName) {
      case "createDocumentation":
        setCreateDocumentationModal(true);
        break;
      case "createPageGroup":
        setCreatePageGroupModal(true);
        break;
      case "createPage":
        setCreatePageModal(true);
        break;
      case "edit":
        setEditModal(true);
        break;
      case "delete":
        setDeleteModal(true);
        break;
      case "cloneDocument":
        setCloneDocumentModal(true);
        break;
      case "pageSizeDropdown":
        setpageSizeDropdown(true);
        break;
      case "loadingModal":
        setLoadingModal(true);
        break;
      case "pageGroupListModal":
        SetPageGroupListModal(true);
        break;
      case "gitBookModal":
        setGitBookModal(true);
        break;
      default:
        console.warn(`Unknown modal: ${modalName}`);
    }
  };

  const closeModal = (modalName: string) => {
    setCurrentModalItem(null);
    switch (modalName) {
      case "createDocumentation":
        setCreateDocumentationModal(false);
        break;
      case "createPageGroup":
        setCreatePageGroupModal(false);
        break;
      case "createPage":
        setCreatePageModal(false);
        break;
      case "edit":
        setEditModal(false);
        break;
      case "delete":
        setDeleteModal(false);
        break;
      case "cloneDocument":
        setCloneDocumentModal(false);
        break;
      case "pageSizeDropdown":
        setpageSizeDropdown(false);
        break;
      case "loadingModal":
        setLoadingModal(false);
        break;
      case "pageGroupListModal":
        SetPageGroupListModal(false);
        break;
      case "gitBookModal":
        setGitBookModal(false);
        break;
      default:
        console.warn(`Unknown modal: ${modalName}`);
    }
  };

  return (
    <ModalContext.Provider
      value={{
        createDocumentationModal,
        createPageGroupModal,
        createPageModal,
        editModal,
        deleteModal,
        cloneDocumentModal,
        currentModalItem,
        setCurrentModalItem,
        pageSizeDropdown,
        loadingModal,
        setLoadingModal,
        loadingMessage,
        setLoadingMessage,
        pageGroupListModal,
        openModal,
        closeModal,
        gitBookModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
