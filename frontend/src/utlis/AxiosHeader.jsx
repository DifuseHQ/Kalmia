import { getTokenFromCookies } from "./CookiesManagement";



const headers =async ()=>{
    const token =await getTokenFromCookies();
    return {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
}

export default headers