import React, { useContext, useState } from "react";
import { AuthContext } from "../../Context/AuthContext";
import axios from "axios"; // Ensure Axios is imported
import { getTokenFromCookies } from "../../utlis/CookiesManagement";
import { Link } from "react-router-dom";
import { toastError, toastSuccess } from "../../utlis/toast";

export default function UserProfile() {
  const { userDetails } = useContext(AuthContext);

  console.log(userDetails);
  const [profileImage, setProfileImage] = useState(
    userDetails.Photo || "/assets/noProfile.png"
  );
  const [selectedFile, setSelectedFile] = useState(null);

  const token = getTokenFromCookies()
  console.log(token);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    console.log(file);
    if (file) {
    const formData = new FormData();
    formData.append("upload", file);

    try {
      const response = await axios.post(
        "http://[::1]:2727/auth/user/upload-photo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization:`Bearer ${token}`
          },
        }
      );
 
      console.log(response.data);
      if (response.status === 200) {
        console.log(response.data.photo);
        setProfileImage(response.data.photo); 
        toastSuccess(response.data.message)
      } 
    } catch (err) {
      console.error(err);
       toastError(err.response.data.message)
    }
  }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <img
              className="h-32 w-32 rounded-full border-4 border-white dark:border-gray-800"
              src={profileImage}
              alt="Profile"
            />
            <label
              htmlFor="upload-button"
              className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-700 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <input
                id="upload-button"
                type="file"
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          </div>

          <div className="flex flex-col gap-4">
            <Link
            to=""
            className="bg-blue-500 px-5 rounded-lg text-white hover:bg-blue-700">
              Edit Profile
            </Link>
            <Link
             to={`/dashboard/user-changePassword?user_id=${userDetails.ID}`}
            >
            <button className="bg-blue-500 px-5 rounded-lg text-white hover:bg-blue-700">
              Change Password
            </button>
            </Link>
          
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <dt className="text-sm font-medium text-gray-500">Username</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {userDetails.Username}
          </dd>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
          <dt className="text-sm font-medium text-gray-500">Email Address</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {userDetails.Email}
          </dd>
        </div>
      </div>
    </div>
  );
}
