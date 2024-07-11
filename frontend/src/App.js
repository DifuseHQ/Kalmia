import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import { ToastContainer } from "react-toastify";
import LoginAuth from "./components/LoginAuth";
import RequireAuth from "./components/RequireAuth";
import AdminAuth from "./components/AdminAuth";
import { Suspense } from "react";
import { ClipLoader } from "react-spinners";
import {
  LoginPage,
  DashboardPage,
  IntroPage,
  CreateDocModal,
  Documentation,
  PageGrouptable,
  CreatepageModal,
  EditPage,
  UserProfile,
  UserResetPassword,
  UserList,
  CreateUser,
  Error500,
  Error,
} from "./utlis/LazyLoadComponents";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Test from "./components/Test";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastContainer />
        <Suspense fallback={<ClipLoader size={50} color={"#123abc"} loading={true} />}>
          <Routes>
            <Route path="/test" element={<Test />} />

            <Route element={<LoginAuth />}>
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<DashboardPage />}>
                <Route index element={<IntroPage />} />
                <Route path="create-documentation" element={<CreateDocModal />} />
                <Route path="edit-documentation" element={<CreateDocModal />} />
                <Route path={`documentation`} element={<Documentation />} />
                <Route path={"documentation/pagegroup"} element={<PageGrouptable />} />
                <Route path="documentation/create-page" element={<CreatepageModal />} />
                <Route path="documentation/edit-page" element={<EditPage />} />
                <Route path="user-profile" element={<UserProfile />} />
                <Route path="user-changePassword" element={<UserResetPassword />} />

                <Route element={<AdminAuth />}>
                  <Route path="admin/user-list" element={<UserList />} />
                  <Route path="admin/create-user" element={<CreateUser />} />
                </Route>

              </Route>
            </Route>

            <Route path="/server-down" element={<Error500 />} />
            <Route path="*" element={<Error />} />
            
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
