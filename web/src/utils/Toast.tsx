import "react-toastify/dist/ReactToastify.css";
import "./Toast.css";

import { toast, ToastOptions, TypeOptions } from "react-toastify";

export const toastMessage = (message: string, type: TypeOptions) => {
  const options: ToastOptions = {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    className: "custom-toast",
  };

  switch (type) {
    case "info":
      toast.info(message, options);
      break;
    case "success":
      toast.success(message, options);
      break;
    case "warning":
      toast.warning(message, options);
      break;
    case "error":
      toast.error(message, options);
      break;
    case "default":
      toast(message, options);
  }
};
