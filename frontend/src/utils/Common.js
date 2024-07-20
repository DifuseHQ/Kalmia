import { toastMessage } from './Toast';
import { DateTime } from 'luxon';

export const handleError = (result, navigate = null) => {
  if (result.status === 'error') {
    if (result.code === 500) {
      if (navigate) {
        navigate(result.path);
      }
    } else {
      toastMessage(result.message, 'error');
    }

    return true;
  }

  return false;
};

export const getFormattedDate = (date) => {
  try {
    const dt = DateTime.fromISO(date).setZone('local');
    return dt.toFormat('dd-MM-yy hh:mm a');
  } catch (error) {
    return date;
  }
};

export const getRandomString = (length) => {
  const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
};

export const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};


export const isTokenExpiringSoon= async(data)=>{

  const expiryDateString = data.expiry.replace(
    /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*/,
    '$1'
  );

    const expiryDate = new Date(expiryDateString);
    const currentTime = new Date();
    const timeDifference = expiryDate.getTime() - currentTime.getTime();
    const oneHourInMilliseconds = 60 * 60 * 1000;
    return timeDifference < oneHourInMilliseconds;
};