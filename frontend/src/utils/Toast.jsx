import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

export const toastMessage = (message, type) => {
  toast[type](message, {
    position: 'top-right',
    autoClose: 1000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined
  });
};


