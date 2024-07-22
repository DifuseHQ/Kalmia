import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import LoginAuth from './protected/LoginAuth';
import RequireAuth from './protected/RequireAuth';
import AdminAuth from './protected/AdminAuth';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from '../src/pages/LoginPage';
import DashboardPage from '../src/pages/DashboardPage';
import CreateDocModal from '../src/components/CreateDocumentModal/CreateDocModal';
import Documentation from '../src/components/Documentation/Documentation';
import PageGroupTable from '../src/components/PageGroup/PageGroupTable';
import CreatePageModal from '../src/components/CreatePageModal/CreatePageModal';
import EditPage from '../src/components/EditPage/EditPage';
import UserProfile from '../src/components/UserProfile/UserProfile';
import UserList from '../src/components/UserList/UserList';
import CreateUser from '../src/components/CreateUser/CreateUser';
import Error500 from '../src/components/error500/Error500';
import Error from '../src/components/error/Error';
import EditUser from './components/EditUser/EditUser';

function App () {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastContainer />
          <Routes>

            <Route element={<LoginAuth />}>
              <Route path='/' element={<LoginPage />} />
              <Route path='/login' element={<LoginPage />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route path='/dashboard' element={<DashboardPage />}>
                <Route index element={<Documentation />} />
                <Route path='create-documentation' element={<CreateDocModal />} />
                <Route path='edit-documentation' element={<CreateDocModal />} />
                <Route path='documentation' element={<Documentation />} />
                <Route path='documentation/page-group' element={<PageGroupTable />} />
                <Route path='documentation/create-page' element={<CreatePageModal />} />
                <Route path='documentation/edit-page' element={<EditPage />} />
                <Route path='user-profile' element={<UserProfile />} />

                <Route element={<AdminAuth />}>
                  <Route path='admin/user-list' element={<UserList />} /> 
                  <Route path='admin/edit-user' element={<EditUser/>}/>
                  <Route path='admin/create-user' element={<CreateUser />} />
                 
                </Route>

              </Route>
            </Route>

            <Route path='/server-down' element={<Error500 />} />
            <Route path='*' element={<Error />} />

          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
