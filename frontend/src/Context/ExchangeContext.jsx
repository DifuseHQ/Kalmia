import React, { createContext, useState } from "react";

export const ExchangeContext = createContext();

export const ExchangeProvider = ({ children }) => {
  const [refresh, setRefresh] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const refreshData = () => {
    setRefresh(!refresh);
  };

  return (
    <ExchangeContext.Provider
      value={{ refresh, refreshData, deleteModal, setDeleteModal }}
    >
      {children}
    </ExchangeContext.Provider>
  );
};
