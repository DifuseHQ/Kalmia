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
import PageGrouptable from "./components/pagegroup/PageGrouptable";
import CreatepageModal from "./components/createPageModal/CreatepageModal";
import EditPage from "./components/editPage/EditPage";
import RequireAuth from "./components/RequireAuth";
import LoginAuth from "./components/LoginAuth";
import Error from "./components/error/Error";
import Error500 from "./components/error500/Error500";
import IntroPage from "./components/IntroPage";

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
              
              <Route path="/test" element={<Test />} />

            <Route element={<LoginAuth/>}>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
            </Route>


           <Route element={<RequireAuth/>}>

              <Route path="/dashboard" element={<DashboardPage />}>
                <Route index element={ <IntroPage/> }/>
                <Route path="create-documentation" element={<CreateDocModal />}/>
                <Route path="edit-documentation" element={<CreateDocModal />} />
                <Route path={`documentation`} element={<Documentation />} />
                <Route path={'documentation/pagegroup'} element={<PageGrouptable />} />
                <Route path="documentation/create-page" element={<CreatepageModal/>} />
                <Route path="documentation/edit-page" element={<EditPage/>} />
              </Route>

            </Route>
            <Route path="/server-down" element={<Error500 />} />
            <Route path="*" element={<Error/>} />
            </Routes>
          </ModalContext.Provider>
        </ExchangeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
