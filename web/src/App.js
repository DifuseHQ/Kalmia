import { StrictMode } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import CreateDocModal from '../src/components/CreateDocumentModal/CreateDocModal';
import CreatePageModal from '../src/components/CreatePageModal/CreatePageModal';
import CreateUser from '../src/components/CreateUser/CreateUser';
import Documentation from '../src/components/Documentation/Documentation';
import EditPage from '../src/components/EditPage/EditPage';
import Error from '../src/components/Error/Error';
import PageGroupTable from '../src/components/PageGroup/PageGroupTable';
import UserList from '../src/components/UserList/UserList';
import DashboardPage from '../src/pages/DashboardPage';
import LoginPage from '../src/pages/LoginPage';

import UserForm from './components/UserForm/UserForm';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminAuth from './protected/AdminAuth';
import LoginAuth from './protected/LoginAuth';
import RequireAuth from './protected/RequireAuth';

import 'react-toastify/dist/ReactToastify.css';

function App () {
  return (
    <StrictMode>
      <Router>
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
                      path="documentation/create-page"
                      element={<CreatePageModal />}
                    />
                    <Route
                      path="documentation/edit-page"
                      element={<EditPage />}
                    />
                    <Route path="user-profile" element={<UserForm />} />

                    <Route element={<AdminAuth />}>
                      <Route path="admin/user-list" element={<UserList />} />
                      <Route path="admin/edit-user/:id" element={<UserForm />} />
                      <Route path="admin/create-user" element={<CreateUser />} />
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
