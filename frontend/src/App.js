import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import LoginAuth from './protected/LoginAuth';
import RequireAuth from './protected/RequireAuth';
import AdminAuth from './protected/AdminAuth';
import { Suspense } from 'react';
import Loading from './components/Loading/Loading';
import {
  LoginPage,
  DashboardPage,
  IntroPage,
  CreateDocModal,
  Documentation,
  PageGrouptable,
  CreatePageModal,
  EditPage,
  UserProfile,
  UserResetPassword,
  UserList,
  CreateUser,
  Error500,
  Error
} from './utils/LazyLoadComponents';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './context/ThemeContext';

function App () {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastContainer />
          <Suspense fallback={<Loading />}>
            <Routes>

              <Route element={<LoginAuth />}>
                <Route path='/' element={<LoginPage />} />
                <Route path='/login' element={<LoginPage />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route path='/dashboard' element={<DashboardPage />}>
                  <Route index element={<IntroPage />} />
                  <Route path='create-documentation' element={<CreateDocModal />} />
                  <Route path='edit-documentation' element={<CreateDocModal />} />
                  <Route path='documentation' element={<Documentation />} />
                  <Route path='documentation/pagegroup' element={<PageGrouptable />} />
                  <Route path='documentation/create-page' element={<CreatePageModal />} />
                  <Route path='documentation/edit-page' element={<EditPage />} />
                  <Route path='user-profile' element={<UserProfile />} />
                  <Route path='user-changePassword' element={<UserResetPassword />} />

                  <Route element={<AdminAuth />}>
                    <Route path='admin/user-list' element={<UserList />} />
                    <Route path='admin/create-user' element={<CreateUser />} />
                  </Route>

                </Route>
              </Route>

              <Route path='/server-down' element={<Error500 />} />
              <Route path='*' element={<Error />} />

            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
