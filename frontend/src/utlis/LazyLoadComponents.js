import React from "react";

export const LoginPage = React.lazy(() => import("../pages/LoginPage"));

export const DashboardPage = React.lazy(() => import("../pages/DashboardPage"));

export const IntroPage = React.lazy(() => import("../components/IntroPage"));

export const CreateDocModal = React.lazy(() => import("../components/createDocumentModal/CreateDocModal"));

export const Documentation = React.lazy(() => import("../components/documentation/Documentation"));

export const PageGrouptable = React.lazy(() => import("../components/pagegroup/PageGrouptable"));

export const CreatepageModal = React.lazy(() => import("../components/createPageModal/CreatepageModal"));

export const EditPage = React.lazy(() => import("../components/editPage/EditPage"));

export const UserProfile = React.lazy(() => import("../components/userProfile/UserProfile"));

export const UserResetPassword = React.lazy(() => import("../components/userResetPassword/UserResetPassword"));

export const UserList = React.lazy(() => import("../components/userList/UserList"));

export const CreateUser = React.lazy(() => import("../components/createUser/CreateUser"));

export const Error500 = React.lazy(() => import("../components/error500/Error500"));

export const Error = React.lazy(() => import("../components/error/Error"));
