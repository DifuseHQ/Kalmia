import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const toastSuccess = (message) => {
  toast.success(message, {
    position: "top-right", // You can specify the position
    autoClose: 1000, // Time (in milliseconds) for the toast to auto-close
    hideProgressBar: false, // Set to true if you want to hide the progress bar
    closeOnClick: true, // Close the toast when clicked
    pauseOnHover: true, // Pause the autoClose timer on hover
    draggable: true, // Allow the user to drag the toast
    progress: undefined, // Use undefined to use the default progress bar
  });
};

const toastError = (message) => {
  toast.error(message, {
    position: "top-right", // You can specify the position
    autoClose: 1000, // Time (in milliseconds) for the toast to auto-close
    hideProgressBar: false, // Set to true if you want to hide the progress bar
    closeOnClick: true, // Close the toast when clicked
    pauseOnHover: true, // Pause the autoClose timer on hover
    draggable: true, // Allow the user to drag the toast
    progress: undefined, // Use undefined to use the default progress bar
  });
};

const toastWarning = (message) => {
  toast.warning(message, {
    position: "top-right", // You can specify the position
    autoClose: 1000, // Time (in milliseconds) for the toast to auto-close
    hideProgressBar: false, // Set to true if you want to hide the progress bar
    closeOnClick: true, // Close the toast when clicked
    pauseOnHover: true, // Pause the autoClose timer on hover
    draggable: true, // Allow the user to drag the toast
    progress: undefined, // Use undefined to use the default progress bar
  });
};
export { toastSuccess, toastError, toastWarning };