import { Icon } from '@iconify/react/dist/iconify.js';
import { AnimatePresence ,motion } from 'framer-motion';
import React, { useState } from 'react'

export default function EditUser() {

    const [isLoading,setisLoading] = useState(false);
    setisLoading() //just for prevent lint you can erase
  return (
        <AnimatePresence className='container mx-auto p-5'>
      <h1 className='text-2xl font-bold mb-5 dark:text-white '>User Profile Edit</h1>
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
                  src={'defaultProfileImage.jpg'}
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
                onChange=""
              />
            </label>

            {/* {showModal && (
              <div className='fixed z-10 inset-0 overflow-y-auto'>
                <div className='flex items-center justify-center min-h-screen'>
                  <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3'>
                    <div className='mt-4' onWheel={handleWheel}>
                      <AvatarEditor
                        
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
            )} */}

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
              onChange="{(e) => setUsername(e.target.value)}"
              value="username"
             
              name='username'
              id='username'
              className={`bg-gray-50 ${
                true
                  ? 'border border-gray-500 focus:ring-primary-600 focus:border-primary-600 dark:bg-gray-600 dark:border-white'
                  : ''
              } text-gray-900 text-sm rounded-lg  block  p-1 px-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500`}
              readOnly="{!isEdit}"
            />
          </div>

          <div className='flex my-4'>
            <p className='text-sm font-medium mr-10 text-gray-500 dark:text-white '>
              Email Address
            </p>
            <input
              onChange='{(e) => setEmail(e.target.value)}'
              value='email'
              type='email'
              name='email'
              id='email'
              className={`bg-gray-50 ${
                true
                  ? 'border border-gray-500 focus:ring-primary-600 focus:border-primary-600 dark:bg-gray-600 dark:border-white'
                  : ''
              } text-gray-900 text-sm rounded-lg  block p-1 px-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500`}
              readOnly='{!isEdit}'
            />
          </div>

          <div className='flex justify-center my-8 gap-5'>
            {true
              ? (
                <button
                  className='btn bg-blue-500 text-white rounded-lg px-5 py-2 hover:bg-blue-700 '
                  onClick='{() => setIsEdit(!isEdit)}'
                >
                  Edit Profile
                </button>
                )
              : (
                <>
                  <button
                    className='btn bg-blue-500 text-white rounded-lg px-5 py-2 hover:bg-blue-700 '
                    onClick='{handleSubmit}'
                  >
                    Update
                  </button>
                  <button
                    className='btn bg-blue-500 text-white rounded-lg px-5 py-2 hover:bg-blue-700 '
                    onClick='{() => {
                      setIsEdit(!isEdit);
                      refreshData();
                    }}'
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
              onChange='{(e) => setPassword(e.target.value)}'
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
              onChange='{(e) => setConfirmPassword(e.target.value)}'
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
              onClick='{handleChangePassword}'
            >
              Update
            </button>
          </div>
        </motion.div>

      </motion.div>
    </AnimatePresence>
  )
}
  