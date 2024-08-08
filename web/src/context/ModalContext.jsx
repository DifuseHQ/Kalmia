import React, { createContext, useState } from 'react';

export const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [createDocumentationModal, setCreateDocumentationModal] =
    useState(false);
  const [createPageGroupModal, setCreatePageGroupModal] = useState(false);
  const [createPageModal, setCreatePageModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [cloneDocumentModal, setCloneDocumentModal] = useState(false);
  const [currentModalItem, setCurrentModalItem] = useState(null);
  const [pageSizeDropdown, setpageSizeDropdown] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading..');

  const openModal = (modalName, item = null) => {
    setCurrentModalItem(item);
    switch (modalName) {
    case 'createDocumentation':
      setCreateDocumentationModal(true);
      break;
    case 'createPageGroup':
      setCreatePageGroupModal(true);
      break;
    case 'createPage':
      setCreatePageModal(true);
      break;
    case 'edit':
      setEditModal(true);
      break;
    case 'delete':
      setDeleteModal(true);
      break;
    case 'cloneDocument':
      setCloneDocumentModal(true);
      break;
    case 'pageSizeDropdown':
      setpageSizeDropdown(true);
      break;
    case 'loadingModal':
      setLoadingModal(true);
      break;
    default:
      console.warn(`Unknown modal: ${modalName}`);
    }
  };

  const closeModal = (modalName) => {
    setCurrentModalItem(null);
    switch (modalName) {
    case 'createDocumentation':
      setCreateDocumentationModal(false);
      break;
    case 'createPageGroup':
      setCreatePageGroupModal(false);
      break;
    case 'createPage':
      setCreatePageModal(false);
      break;
    case 'edit':
      setEditModal(false);
      break;
    case 'delete':
      setDeleteModal(false);
      break;
    case 'cloneDocument':
      setCloneDocumentModal(false);
      break;
    case 'pageSizeDropdown':
      setpageSizeDropdown(false);
      break;
    case 'loadingModal':
      setLoadingModal(false);
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
        openModal,
        closeModal
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
