import { initFlowbite } from "flowbite";
import React, { useEffect, useState } from "react";
import Error from "./error/Error";
import axios from "../api/axios";
import { getTokenFromCookies } from "../utlis/CookiesManagement";
import { toastError } from "../utlis/toast";


export default function Test() {

  useEffect(() => {
    initFlowbite();
  }, []);

  const token = getTokenFromCookies();

  const handleClick = async( ) => {
    try {
      const { data, status } = await axios.post(
        `auth/jwt/validate`,
       {
        token: token
       },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(data);
      // if (status === 200) {
      //   setDocumentData(data);
      //   setLoading(false);
      // } else {
      //   console.error("Failed to fetch data:", status.statusText);
      // }
    } catch (err) {
      console.log(err);
      console.log("starte");
      if (!err?.response) {
        toastError('No Server Response');
    } else if (err.response?.status === 400) {
      console.log(err.response.statusText);
      toastError(err.response.data.error);
    } else if (err.response?.status === 401) {

      console.log(err.response.statusText);
        toastError(err.response.data.error)
    } else {
      toastError('Login Failed');
    }
    // errRef.current.focus();  for screen reader
    }
  }

  return (
    <div>
     <button onClick={handleClick}>click here</button>
    </div>
  );
}
