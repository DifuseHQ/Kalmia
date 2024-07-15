import React from 'react';

export const LoginPage = React.lazy(() => import('../pages/LoginPage'));

export const DashboardPage = React.lazy(() => import('../pages/DashboardPage'));

export const IntroPage = React.lazy(() => import('../components/Introduction/IntroPage'));

export const CreateDocModal = React.lazy(() => import('../components/CreateDocumentModal/CreateDocModal'));

export const Documentation = React.lazy(() => import('../components/Documentation/Documentation'));

export const PageGrouptable = React.lazy(() => import('../components/PageGroup/PageGrouptable'));

export const CreatePageModal = React.lazy(() => import('../components/CreatePageModal/CreatePageModal'));

export const EditPage = React.lazy(() => import('../components/EditPage/EditPage'));

export const UserProfile = React.lazy(() => import('../components/UserProfile/UserProfile'));

export const UserResetPassword = React.lazy(() => import('../components/UserResetPassword/UserResetPassword'));

export const UserList = React.lazy(() => import('../components/UserList/UserList'));

export const CreateUser = React.lazy(() => import('../components/CreateUser/CreateUser'));

export const Error500 = React.lazy(() => import('../components/error500/Error500'));

export const Error = React.lazy(() => import('../components/error/Error'));
