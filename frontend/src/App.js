import { createContext, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import { ExchangeProvider } from "./Context/ExchangeContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { ToastContainer } from "react-toastify";
import Documentation from "./components/documentation/Documentation";
import CreateDocModal from "./components/createDocumentModal/CreateDocModal";
import Test from "./components/Test";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Table from "./components/table/Table";
import PageGrouptable from "./components/pagegroup/PageGrouptable";
import CreatePageGroup from "./components/createPageGroup/CreatePageGroup";
import CreatepageModal from "./components/createPageModal/CreatepageModal";
import EditPage from "./components/editPage/EditPage";

export const ModalContext = createContext();

function App() {
  const [isOpenModal, setIsOpenModal] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <ExchangeProvider>
          <ModalContext.Provider value={{ isOpenModal, setIsOpenModal }}>
            <ToastContainer />
            <Routes>
              <Route path="/" element={<h1>First Page</h1>} />
              <Route path="/test" element={<CreatePageGroup />} />
              <Route path="/login" element={<LoginPage />} />

              <Route path="/dashboard" element={<DashboardPage />}>
                <Route
                  index
                  element={
                    <h1>
                      new page ny of a class of electronic devices that convert
                      digital data signals into modulated analog signals
                      suitable for transmission over analog telecommunications
                      circuitsny of a class of electronic devices that convert
                      digital data signals into modulated analog signals
                      suitable for transmission over analog telecommunications
                      circuitsny of a class of electronic devices that convert
                      digital data signals into modulated analog signals
                      suitable for transmission over analog telecommunications
                      circuitsny of a class of electronic devices that convert
                      digital data signals into modulated analog signals
                      suitable for transmission over analog telecommunications
                      circuitsny of a class of electronic devices that convert
                      digital data signals into modulated analog signals
                      suitable for transmission over analog telecommunications
                      circuitsny of a class of electronic devices that convert
                      digital data signals into modulated analog signals
                      suitable for transmission over analog telecommunications
                      circuits
                    </h1>
                  }
                />
                <Route
                  path="create-documentation"
                  element={<CreateDocModal />}
                />
                <Route path="edit-documentation" element={<CreateDocModal />} />
                <Route path={`documentation`} element={<Documentation />} />
                
                <Route path={'documentation/pagegroup'} element={<PageGrouptable />} />
                <Route path="documentation/create-page" element={<CreatepageModal/>} />
                <Route path="documentation/edit-page" element={<EditPage/>} />
                
              </Route>
            </Routes>
          </ModalContext.Provider>
        </ExchangeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
