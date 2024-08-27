import { Icon } from "@iconify/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import {
  getUser,
  updateUser,
  UpdateUserPayload,
  uploadFile,
} from "../../api/Requests";
import { AuthContext, AuthContextType } from "../../context/AuthContext";
import { UserDetails } from "../../hooks/useUserDetails";
import { DOMEvent } from "../../types/dom";
import { handleError } from "../../utils/Common";
import { toastMessage } from "../../utils/Toast";
import Breadcrumb from "../Breadcrumb/Breadcrumb";

export default function UserForm() {
  const { t } = useTranslation();
  const authContext = useContext(AuthContext);
  const { user: currentUser, refreshData } = authContext as AuthContextType;
  const { id: userIdString } = useParams();
  const userId: number | null = userIdString
    ? parseInt(userIdString, 10)
    : null;
  const navigate = useNavigate();
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserDetails | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [imageFile, setImageFile] = useState<string | File | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  const [profileImage, setProfileImage] = useState<string>(
    "/assets/images/no-profile.png",
  );
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPasswod, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<AvatarEditor | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const idToFetch =
          userId && currentUser?.admin
            ? Number(userId)
            : Number(currentUser?.userId);
        const response = await getUser(idToFetch);

        if (handleError(response, navigate, t)) return;

        setUserData(response.data);
        setUsername(response.data.username);
        setEmail(response.data.email);
        setPassword("");
        setConfirmPassword("");
        setProfileImage(response.data.photo || "/assets/images/no-profile.png");
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userId, currentUser, navigate]);

  useEffect(() => {
    if (isEdit && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEdit]);

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    const allowedTypes = ["image/jpeg", "image/png"];
    if (file && allowedTypes.includes(file.type)) {
      const reader = new window.FileReader();
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === "string") {
          setImageFile(reader.result);
          setShowModal(true);
        }
      };
      reader.readAsDataURL(file);
    } else {
      toastMessage(t("please_upload_a_jpeg_or_png_image"), "error");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setShowModal(false);

    if (editorRef.current) {
      const canvas = editorRef.current.getImage();
      canvas.toBlob(async (blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append("upload", blob, "cropped-image.jpg");

          const photo = await uploadFile(formData);

          if (handleError(photo, navigate, t)) {
            setIsLoading(false);
            return;
          }

          if (photo.status === "success") {
            const image = photo?.data?.file;
            setProfileImage(image);
            setIsLoading(false);

            const result = await updateUser({
              id: Number(userData?.id),
              photo: image,
            });

            if (handleError(result, navigate, t)) {
              setIsLoading(false);
              return;
            }

            if (result.status === "success") {
              setIsLoading(false);
              toastMessage(t("user_photo_updated"), "success");
              refreshData();
            }
          }
        } else {
          setIsLoading(false);
        }
      }, "image/jpeg");
    } else {
      setIsLoading(false);
      refreshData();
    }
  };

  const handleSubmit = async (e: DOMEvent) => {
    e.preventDefault();

    if (userData?.username === username && userData?.email === email) {
      toastMessage(t("no_changes_detected"), "warning");
      return;
    }

    const updateDetails: UpdateUserPayload = {
      id: Number(userData?.id),
      username,
      email,
    };

    const result = await updateUser(updateDetails);

    if (handleError(result, navigate, t)) return;

    if (result.status === "success") {
      toastMessage(t("user_details_updated"), "success");
      setIsEdit(!isEdit);
      refreshData();
    }
  };

  const handleChangePassword = async (e: DOMEvent) => {
    e.preventDefault();
    if (!password) {
      toastMessage(t("enter_new_password"), "warning");
      return;
    }

    if (password.length < 8) {
      toastMessage(t("password_too_weak"), "warning");
      return;
    }

    if (password !== confirmPasswod) {
      toastMessage(t("password_and_confirm_password_miss_match"), "warning");
      return;
    }

    const result = await updateUser({
      id: Number(userData?.id),
      password: password.toString(),
    });

    if (handleError(result, navigate, t)) return;
    if (result.status === "success") {
      refreshData();
      toastMessage(t("password_change_successfully"), "success");
      setPassword("");
      setConfirmPassword("");
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    setScale((prevScale) => {
      const newScale =
        delta > 0
          ? Math.max(1, prevScale - 0.1)
          : Math.min(2.5, prevScale + 0.1);
      return Number(newScale) || 0.5;
    });
  };

  return (
    <div className="w-full mx-auto">
      <Breadcrumb />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Profile Image Section - Centered at the top */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-48 w-48 rounded-full border-4 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
              </div>
            ) : (
              <img
                className="h-48 w-48 rounded-full border-4 border-gray-200 dark:border-gray-700 object-cover"
                src={profileImage || "/assets/images/no-profile.png"}
                alt="Profile"
              />
            )}
            <span
              className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 cursor-pointer shadow-lg transition duration-300"
              onClick={() => {
                const element = document.getElementById(
                  "upload-profile-photo-button",
                );
                if (element) {
                  element.click();
                }
              }}
            >
              <Icon icon="mdi:camera" className="w-5 h-5" />
              <input
                accept="image/jpeg, image/png"
                id="upload-profile-photo-button"
                type="file"
                className="hidden z-50"
                onChange={handleUploadFile}
              />
            </span>
          </div>
        </div>

        {/* User Details Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t("user_details")}
          </h2>
          <div className="mb-6">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("username")}
            </span>
            <input
              type="text"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              ref={inputRef}
              className={`w-full px-3 py-2 border rounded-md ${
                isEdit
                  ? "border-blue-500 focus:ring-2 focus:ring-blue-500"
                  : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              readOnly={!isEdit}
            />
          </div>

          <div className="mb-6">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("email_address")}
            </span>
            <input
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className={`w-full px-3 py-2 border rounded-md ${
                isEdit
                  ? "border-blue-500 focus:ring-2 focus:ring-blue-500"
                  : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              readOnly={!isEdit}
            />
          </div>

          <div className="flex justify-start space-x-4">
            {!isEdit ? (
              <button
                className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition duration-300"
                onClick={() => setIsEdit(!isEdit)}
              >
                {t("edit_profile")}
              </button>
            ) : (
              <>
                <button
                  className="bg-green-500 text-white rounded-md px-4 py-2 hover:bg-green-600 transition duration-300"
                  onClick={handleSubmit}
                >
                  {t("update")}
                </button>
                <button
                  className="bg-gray-500 text-white rounded-md px-4 py-2 hover:bg-gray-600 transition duration-300"
                  onClick={() => {
                    setIsEdit(!isEdit);
                    refreshData();
                  }}
                >
                  {t("cancel")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Password Reset Section */}
        <div className="mt-12 border-t pt-8 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {t("reset_password")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("new_password")}
              </span>
              <input
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                id="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-DMSBG-100
3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("confirm_password")}
              </span>
              <input
                type="password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                id="confirm-password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              className="bg-blue-500 text-white rounded-md px-6 py-2 hover:bg-blue-600 transition duration-300"
              onClick={handleChangePassword}
            >
              {t("update_password")}
            </button>
          </div>
        </div>
      </div>

      {/* Image Cropping Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              {t("crop_image")}
            </h3>
            <div onWheel={handleWheel}>
              {imageFile && (
                <AvatarEditor
                  ref={editorRef}
                  image={imageFile}
                  width={250}
                  height={250}
                  border={50}
                  borderRadius={125}
                  scale={Number(scale)}
                  rotate={0}
                />
              )}
            </div>
            <div className="mt-4">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("scale")}
              </span>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.01"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-300"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
