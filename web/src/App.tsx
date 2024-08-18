import "react-toastify/dist/ReactToastify.css";

import { StrictMode } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import CreateDocModal from "./components/CreateDocumentModal/CreateDocModal";
import CreateUser from "./components/CreateUser/CreateUser";
import Documentation from "./components/Documentation/Documentation";
import EditPage from "./components/EditPage/EditPage";
import Error from "./components/Error/Error";
import PageGroupTable from "./components/PageGroup/PageGroupTable";
import UserForm from "./components/UserForm/UserForm";
import UserList from "./components/UserList/UserList";
import { AuthProvider } from "./context/AuthContext";
import { ModalProvider } from "./context/ModalContext";
import { ThemeProvider } from "./context/ThemeContext";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import AdminAuth from "./protected/AdminAuth";
import LoginAuth from "./protected/LoginAuth";
import RequireAuth from "./protected/RequireAuth";

const baseName = process.env.NODE_ENV === "development" ? "" : "/admin";

function App() {
  return (
    <StrictMode>
      <Router basename={baseName}>
        <ThemeProvider>
          <ModalProvider>
            <AuthProvider>
              <ToastContainer />
              <Routes>
                <Route element={<LoginAuth />}>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/login/gh" element={<LoginPage />} />
                  <Route path="/login/ms" element={<LoginPage />} />
                  <Route path="/login/gg" element={<LoginPage />} />
                </Route>

                <Route element={<RequireAuth />}>
                  <Route path="/dashboard" element={<DashboardPage />}>
                    <Route index element={<Documentation />} />
                    <Route
                      path="create-documentation"
                      element={<CreateDocModal />}
                    />
                    <Route
                      path="edit-documentation"
                      element={<CreateDocModal />}
                    />
                    <Route path="documentation" element={<Documentation />} />
                    <Route
                      path="documentation/page-group"
                      element={<PageGroupTable />}
                    />
                    <Route
                      path="documentation/edit-page"
                      element={<EditPage />}
                    />
                    <Route path="user-profile/:id" element={<UserForm />} />

                    <Route element={<AdminAuth />}>
                      <Route path="admin/user-list" element={<UserList />} />
                      <Route
                        path="admin/edit-user/:id"
                        element={<UserForm />}
                      />
                      <Route
                        path="admin/create-user"
                        element={<CreateUser />}
                      />
                    </Route>
                  </Route>
                </Route>

                <Route path="error/:code" element={<Error />} />
                <Route path="error" element={<Error />} />
                <Route path="*" element={<Error />} />
                {/* <Route path="/error" element={<Error />} /> */}
              </Routes>
            </AuthProvider>
          </ModalProvider>
        </ThemeProvider>
      </Router>
    </StrictMode>
  );
}

export default App;
