import React, { useContext, useEffect, useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

import { getUsers, updateUser, uploadPhoto } from '../../api/Requests';
import { AuthContext } from '../../context/AuthContext';
import { handleError } from '../../utils/Common';
import { toastMessage } from '../../utils/Toast';
import Breadcrumb from '../Breadcrumb/Breadcrumb';

export default function UserProfile () {
  const { t } = useTranslation();
  const { user, refresh, refreshData } = useContext(AuthContext);
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const [userData, setUserData] = useState([]);
  const [editor, setEditor] = useState(null);
  const [scale, setScale] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [profileImage, setProfileImage] = useState('/admin/assets/images/no-profile.png');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPasswod, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const users = await getUsers();

      if (handleError(users, navigate, t)) return;

      if (users.status === 'success') {
        const data = users.data;
        const filterUser = data?.find(
          (obj) => obj.id.toString() === user.userId
        );
        setUserData(filterUser);
        setUsername(filterUser.username);
        setEmail(filterUser.email);
        setProfileImage(filterUser.photo || '/admin/assets/images/no-profile.png');
      }
    };
    fetchData();
  }, [user, refresh, navigate, t]);

  useEffect(() => {
    if (isEdit) {
      inputRef.current.focus();
    }
  }, [isEdit]);

  const handleUploadFile = (e) => {
    const file = e.target.files[0];
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (file && allowedTypes.includes(file.type)) {
      const reader = new window.FileReader();
      reader.onloadend = () => {
        setImageFile(reader.result);
        setShowModal(true);
      };
      reader.readAsDataURL(file);
    } else {
      toastMessage(t('please_upload_a_jpeg_or_png_image'), 'error');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setShowModal(false);

    if (editor) {
      const canvas = editor.getImage();
      canvas.toBlob(async (blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append('upload', blob, 'cropped-image.jpg');

          // Upload the photo
          const photo = await uploadPhoto(formData);

          if (handleError(photo, navigate, t)) {
            setIsLoading(false);
            return;
          }

          if (photo.status === 'success') {
            const image = photo?.data?.photo;
            setProfileImage(image);
            setIsLoading(false);

            const result = await updateUser({
              id: Number(userData.id),
              photo: image
            });

            if (handleError(result, navigate, t)) {
              setIsLoading(false);
              return;
            }

            if (result.status === 'success') {
              setIsLoading(false);
              toastMessage(t('user_photo_updated'), 'success');
              refreshData();
            }
          }
        } else {
          setIsLoading(false);
        }
      }, 'image/jpeg');
    } else {
      setIsLoading(false);
      refreshData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userData.username === username && userData.email === email) {
      toastMessage(t('no_changes_detected'), 'warn');
      return;
    }

    const result = await updateUser({
      id: Number(userData.id),
      username,
      email
    });

    if (handleError(result, navigate, t)) return;

    if (result.status === 'success') {
      toastMessage(t('user_details_updated'), 'success');
      setIsEdit(!isEdit);
      refreshData();
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!password) {
      toastMessage(t('enter_new_password'), 'warn');
      return;
    }

    if (password.length < 8) {
      toastMessage(t('password_too_weak'), 'warn');
      return;
    }

    if (password !== confirmPasswod) {
      toastMessage(t('password_and_confirm_password_miss_match'), 'warning');
      return;
    }

    const result = await updateUser({
      id: Number(userData.id),
      password: password.toString()
    });

    if (handleError(result, navigate, t)) return;
    if (result.status === 'success') {
      refreshData();
      toastMessage(t('password_change_successfully'), 'success');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    setScale((prevScale) => {
      const newScale = delta > 0 ? Math.max(1, prevScale - 0.1) : Math.min(2.5, prevScale + 0.1);
      return newScale;
    });
  };

  return (
    <div className='container'>
      <Breadcrumb />
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
        <div className='flex flex-col md:flex-row'>
          {/* Profile Image Section */}
          <div className='md:w-1/3 mb-6 md:mb-0'>
            <div className='relative inline-block'>
              {isLoading
                ? (
                  <div className='flex items-center justify-center h-48 w-48 rounded-full border-4 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500' />
                  </div>
                  )
                : (
                  <img
                    className='h-48 w-48 rounded-full border-4 border-gray-200 dark:border-gray-700 object-cover'
                    src={profileImage || '/admin/assets/images/no-profile.png'}
                    alt='Profile'
                  />
                  )}
              <span
                className='absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 cursor-pointer shadow-lg transition duration-300'
              >
                <Icon icon='mdi:camera' className='w-5 h-5' />
                <input
                  id='upload-button'
                  type='file'
                  className='hidden'
                  onChange={handleUploadFile}
                />
              </span>
            </div>
          </div>

          {/* User Details Section */}
          <div className='md:w-2/3 md:pl-8'>
            <div className='mb-6'>
              <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                {t('username')}
              </span>
              <input
                id='username'
                type='text'
                name='username'
                onChange={(e) => setUsername(e.target.value)}
                value={username}
                ref={inputRef}
                className={`w-full px-3 py-2 border rounded-md ${isEdit
                    ? 'border-blue-500 focus:ring-2 focus:ring-blue-500'
                    : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                readOnly={!isEdit}
              />
            </div>

            <div className='mb-6'>
              <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                {t('username')}
              </span>
              <input
                id='email'
                type='email'
                name='email'
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className={`w-full px-3 py-2 border rounded-md ${isEdit
                    ? 'border-blue-500 focus:ring-2 focus:ring-blue-500'
                    : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                readOnly={!isEdit}
              />
            </div>

            <div className='flex justify-end space-x-4'>
              {!isEdit
                ? (
                  <button
                    className='bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition duration-300'
                    onClick={() => setIsEdit(!isEdit)}
                  >
                    Edit Profile
                  </button>
                  )
                : (
                  <>
                    <button
                      className='bg-green-500 text-white rounded-md px-4 py-2 hover:bg-green-600 transition duration-300'
                      onClick={handleSubmit}
                    >
                      Update
                    </button>
                    <button
                      className='bg-gray-500 text-white rounded-md px-4 py-2 hover:bg-gray-600 transition duration-300'
                      onClick={() => {
                        setIsEdit(!isEdit);
                        refreshData();
                      }}
                    >
                      Cancel
                    </button>
                  </>
                  )}
            </div>
          </div>
        </div>

        {/* Password Reset Section */}
        <div className='mt-12 border-t pt-8 dark:border-gray-700'>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-6'>
            Reset Password
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <span
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
              >
                New Password
              </span>
              <input
                type='password'
                onChange={(e) => setPassword(e.target.value)}
                id='password'
                autoComplete='new-password'
                placeholder='••••••••'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
              />
            </div>
            <div>
              <span
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
              >
                Confirm Password
              </span>
              <input
                type='password'
                onChange={(e) => setConfirmPassword(e.target.value)}
                id='confirm-password'
                autoComplete='new-password'
                placeholder='••••••••'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
              />
            </div>
          </div>
          <div className='mt-6'>
            <button
              className='bg-blue-500 text-white rounded-md px-6 py-2 hover:bg-blue-600 transition duration-300'
              onClick={handleChangePassword}
            >
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* Image Cropping Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-96'>
            <h3 className='text-lg font-semibold mb-4 dark:text-white'>Crop Image</h3>
            <div onWheel={handleWheel}>
              <AvatarEditor
                ref={setEditor}
                image={imageFile}
                width={250}
                height={250}
                border={50}
                borderRadius={125}
                scale={scale}
                rotate={0}
              />
            </div>
            <div className='mt-4'>
              <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Scale
              </span>
              <input
                type='range'
                min='1'
                max='2.5'
                step='0.01'
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                className='w-full'
              />
            </div>
            <div className='mt-6 flex justify-end space-x-4'>
              <button
                onClick={() => setShowModal(false)}
                className='px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-300'
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300'
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
