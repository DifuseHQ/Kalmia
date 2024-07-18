import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import instance from '../../api/AxiosInstance';
import { getTokenFromCookies } from '../../utils/CookiesManagement';
import { toastMessage } from '../../utils/Toast';

export default function UserProfile () {
  const { refresh, refreshData } = useContext(AuthContext);
  const [isEdit, setIsEdit] = useState(false);
  const [isPasswordChange, setIsPasswordChange] = useState(false);
  const navigate = useNavigate();
  const [userData, setUserData] = useState([]);

  const [profileImage, setProfileImage] = useState('/assets/noProfile.png');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPasswod, setConfirmPassword] = useState('');

  const token = getTokenFromCookies();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEdit) {
      inputRef.current.focus();
    }
  }, [isEdit]);

  useEffect(() => {
    const tokenData = JSON.parse(Cookies.get('accessToken'));
    const accessToken = jwtDecode(tokenData.token);
    const fetchData = async () => {
      try {
        const { data, status } = await instance.get('/auth/users');
        if (status === 200) {
          const filterUser = data.find(
            (obj) => obj.id.toString() === accessToken.user_id
          );
          setUserData(filterUser);
          setUsername(filterUser.username);
          setEmail(filterUser.email);
          setProfileImage(filterUser.photo || '/assets/noProfile.png');
        }
      } catch (err) {
        if (!err.response) {
          toastMessage(err?.message, 'error');
          navigate('/server-down');
        }
        toastMessage(err?.response?.data?.message, 'error');
      }
    };
    fetchData();
  }, [refresh, navigate]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    console.log(file);
    if (file) {
      const formData = new FormData();
      formData.append('upload', file);

      try {
        const response = await axios.post(
          'http://[::1]:2727/auth/user/upload-photo',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (response?.status === 200) {
          if (response?.data?.photo) {
            const image = response?.data?.photo;
            uploadImage(image);
          }
        }
      } catch (err) {
        if (!err.response) {
          toastMessage(err?.message, 'error');
          navigate('/server-down');
        }
        toastMessage(err?.response?.data?.message, 'error');
      }
    }
  };

  const uploadImage = async (image) => {
    try {
      const response = await instance.post('/auth/user/edit', {
        id: Number(userData.id),
        photo: image
      });
      if (response?.status === 200) {
        toastMessage('user photo updated', 'success');
        refreshData();
      }
    } catch (err) {
      if (!err.response) {
        toastMessage(err?.message, 'error');
        navigate('/server-down');
      }
      toastMessage(err?.response?.data?.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userData.username === username && userData.email === email) {
      toastMessage('No changes were made to your profile', 'warn');
      return;
    }
    try {
      const response = await instance.post('/auth/user/edit', {
        id: Number(userData.id),
        username,
        email
      });
      if (response?.status === 200) {
        toastMessage('user details updated', 'success');
        refreshData();
      }
    } catch (err) {
      if (!err.response) {
        toastMessage(err?.message, 'error');
        navigate('/server-down');
      }
      toastMessage(err?.response?.data?.message, 'error');
    }
  };
  const handleOpenEdit = (message) => {
    if (message === 'editProfile') {
      setIsEdit(!isEdit);
    } else if (message === 'changePassword') {
      setIsPasswordChange(!isPasswordChange);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!password) {
      toastMessage('Enter new password', 'warning');
      return;
    }

    if (password.length < 8) {
      toastMessage('Password must be 8 characters', 'warning');
      return;
    }

    if (password !== confirmPasswod) {
      toastMessage('Password and Confirm password miss match', 'warning');
      return;
    }

    try {
      const response = await instance.post('/auth/user/edit', {
        id: Number(userData.id),
        password: password.toString()
      });
      if (response?.status === 200) {
        refreshData();
        toastMessage('password change successfully', 'success');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        toastMessage('Error changing password', 'error');
        navigate('/server-down');
      }
      toastMessage(err?.response?.data?.message, 'error');
    }
  };

  return (
    <AnimatePresence className='container mx-auto p-5'>
      <h1 className='text-2xl font-bold mb-5 dark:text-white '>User Profile</h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='flex flex-col  items-start sm:w-2/3 md:w-2/3 lg:w-2/3 w-full'
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='flex justify-between items-center mb-6'
        >
          <div className='relative'>
            <img
              className='h-32 w-32 rounded-full border-4 border-white dark:border-gray-800'
              src={profileImage}
              alt='Profile'
            />
            <label
              htmlFor='upload-button'
              className='absolute bottom-0 right-0  text-blue-600 rounded-full p-2 hover:text-blue-500 cursor-pointer'
            >
              <Icon icon='octicon:feed-plus-16' className='w-10 h-10' />
              <input
                id='upload-button'
                type='file'
                className='hidden'
                onChange={handleUpload}
              />
            </label>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='w-2/3'
        >

          <div className='flex my-4'>
            <p className='text-sm mr-16 font-medium text-gray-500 dark:text-white'>
              Username
            </p>
            <input
              type='text'
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              ref={inputRef}
              name='username'
              id='username'
              className={`bg-gray-50 ${
                isEdit
                  ? 'border border-gray-500 focus:ring-primary-600 focus:border-primary-600 dark:bg-gray-600 dark:border-white'
                  : ''
              } text-gray-900 text-sm rounded-lg  block  p-1 px-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500`}
              readOnly={!isEdit}
            />
          </div>

          <div className='flex my-4'>
            <p className='text-sm font-medium mr-10 text-gray-500 dark:text-white '>
              Email Address
            </p>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type='email'
              name='email'
              id='email'
              className={`bg-gray-50 ${
                isEdit
                  ? 'border border-gray-500 focus:ring-primary-600 focus:border-primary-600 dark:bg-gray-600 dark:border-white'
                  : ''
              } text-gray-900 text-sm rounded-lg  block p-1 px-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500`}
              readOnly={!isEdit}
            />
          </div>

          <div className='flex justify-center my-8 gap-5'>
            <button
              className='btn bg-blue-500 text-white rounded-lg px-5 py-2 hover:bg-blue-700 '
              onClick={handleSubmit}
            >
              Save
            </button>
            <button
              className='btn bg-blue-500 text-white rounded-lg px-5 py-2 hover:bg-blue-700 '
              onClick={() => handleOpenEdit('editProfile')}
            >
              Edit Profile
            </button>
          </div>

        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='w-full rounded-lg  md:mt-0 sm:max-w-md dark:bg-gray-800 dark:border-gray-700'
        >
          <div className='flex justify-center items-center pb-4 mb-4 rounded-t sm:mb-1 dark:border-gray-600'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Reset Password
            </h3>
          </div>

          <div className='mb-5'>
            <label
              htmlFor='password'
              className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
            >
              New Password
            </label>
            <input
              type='password'
              onChange={(e) => setPassword(e.target.value)}
              name='password'
              id='password'
              autoComplete='new-password'
              placeholder='••••••••'
              className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
              required=''
            />
          </div>
          <div>
            <label
              htmlFor='confirm-password'
              className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
            >
              Confirm password
            </label>
            <input
              type='password'
              onChange={(e) => setConfirmPassword(e.target.value)}
              name='confirm-password'
              id='confirm-password'
              autoComplete='new-password'
              placeholder='••••••••'
              className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
              required=''
            />
          </div>
          <div className='flex gap-5 justify-center my-5'>
            <button
              className='btn bg-blue-500 text-white rounded-lg px-5 py-2 hover:bg-blue-700 '
              onClick={handleChangePassword}
            >
              Save
            </button>
          </div>
        </motion.div>

      </motion.div>
    </AnimatePresence>
  );
}
