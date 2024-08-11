import { toast } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import './Toast.css';

export const toastMessage = (message, type) => {
  toast[type](message, {
    position: 'bottom-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    className: 'custom-toast'
  });
};
