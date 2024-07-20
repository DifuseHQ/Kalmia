import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import AvatarEditor from 'react-avatar-editor';
import { AuthContext } from '../../context/AuthContext';
import { toastMessage } from '../../utils/Toast';
import { getUsers, updateUser, uploadPhoto } from '../../api/Requests';
import { handleError } from '../../utils/Common';

export default function UserProfile () {
  const { user, refresh, refreshData } = useContext(AuthContext);
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const [userData, setUserData] = useState([]);
  const [editor, setEditor] = useState(null);
  const [scale, setScale] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [profileImage, setProfileImage] = useState('/assets/noProfile.png');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPasswod, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const users = await getUsers();

      if (handleError(users, navigate)) return;

      if (users.status === 'success') {
        const data = users.data;
        const filterUser = data.find(
          (obj) => obj.id.toString() === user.user_id
        );
        setUserData(filterUser);
        setUsername(filterUser.username);
        setEmail(filterUser.email);
        setProfileImage(filterUser.photo || '/assets/noProfile.png');
      }
    };
    fetchData();
  }, [user, refresh, navigate]);

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
      toastMessage('Please upload a JPEG or PNG image', 'error');
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

          if (handleError(photo, navigate)) {
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

            if (handleError(result, navigate)) {
              setIsLoading(false);
              return;
            }

            if (result.status === 'success') {
              setIsLoading(false);
              toastMessage('User photo updated', 'success');
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
      toastMessage('No changes were made to your profile', 'warn');
      return;
    }

    const result = await updateUser({
      id: Number(userData.id),
      username,
      email
    });

    if (handleError(result, navigate)) return;

    if (result.status === 'success') {
      toastMessage('user details updated', 'success');
      setIsEdit(!isEdit);
      refreshData();
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!password) {
      toastMessage('Enter new password', 'warn');
      return;
    }

    if (password.length < 8) {
      toastMessage('Password must be 8 characters', 'warn');
      return;
    }

    if (password !== confirmPasswod) {
      toastMessage('Password and Confirm password miss match', 'warning');
      return;
    }

    const result = await updateUser({
      id: Number(userData.id),
      password: password.toString()
    });

    if (handleError(result, navigate)) return;
    if (result.status === 'success') {
      refreshData();
      toastMessage('password change successfully', 'success');
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
    <AnimatePresence className='container mx-auto p-5'>
      <h1 className='text-2xl font-bold mb-5 dark:text-white '>User Profile</h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='flex flex-col  items-start sm:w-2/3 md:w-2/3 lg:w-2/3 w-full'
        key='user-profile-container'
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='flex justify-between items-center mb-6'
          key='user-profile-image'
        >
          <div className='relative'>
            {isLoading
              ? (

                <div className='flex items-center justify-center h-32 w-32 rounded-full border-4 border-white dark:bg-gray-700 dark:border-gray-800'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300' />
                </div>

                )
              : (

                <img
                  className='h-32 w-32 rounded-full border-4 border-white dark:border-gray-800'
                  src={profileImage || 'defaultProfileImage.jpg'}
                  alt='Profile'
                />
                )}
            <label
              htmlFor='upload-button'
              className='absolute bottom-0 right-0  text-blue-600 rounded-full p-2 hover:text-blue-500 cursor-pointer'
            >
              <Icon icon='octicon:feed-plus-16' className='w-10 h-10' />
              <input
                id='upload-button'
                type='file'
                className='hidden'
                onChange={handleUploadFile}
              />
            </label>

            {showModal && (
              <div className='fixed z-10 inset-0 overflow-y-auto'>
                <div className='flex items-center justify-center min-h-screen'>
                  <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3'>
                    <div className='mt-4' onWheel={handleWheel}>
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
                      <div className='flex justify-around mt-2 '>
                        <div className='flex flex-col'>
                          <span className='dark:text-white text-md'>scale</span>
                          <input
                            type='range'
                            min='1'
                            max='2.5'
                            step='0.01'
                            value={scale}
                            onChange={(e) => setScale(e.target.value)}
                          />
                        </div>
                        <button onClick={handleSave} className='bg-blue-500 text-white rounded px-4 py-2'>
                          Crop
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='w-2/3'
          key='user-profile-details'
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
            {!isEdit
              ? (
                <button
                  className='btn bg-blue-500 text-white rounded-lg px-5 py-2 hover:bg-blue-700 '
                  onClick={() => setIsEdit(!isEdit)}
                >
                  Edit Profile
                </button>
                )
              : (
                <>
                  <button
                    className='btn bg-blue-500 text-white rounded-lg px-5 py-2 hover:bg-blue-700 '
                    onClick={handleSubmit}
                  >
                    Update
                  </button>
                  <button
                    className='btn bg-blue-500 text-white rounded-lg px-5 py-2 hover:bg-blue-700 '
                    onClick={() => {
                      setIsEdit(!isEdit);
                      refreshData();
                    }}
                  >
                    cancel
                  </button>
                </>
                )}

          </div>

        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='w-full rounded-lg  md:mt-0 sm:max-w-md  '
          key='user-profile-reset-password'
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
              Update
            </button>
          </div>
        </motion.div>

      </motion.div>
    </AnimatePresence>
  );
}
