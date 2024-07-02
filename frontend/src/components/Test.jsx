import React from 'react'
import axios from '../api/axios'
import { getTokenFromCookies } from '../utlis/CookiesManagement'

export default function Test() {

  const token = getTokenFromCookies();
  console.log(token);

 const handleClick=async()=>{
  const res = await axios.get('http://[::1]:2727/health/ping',{
    headers:{
      'Content-Type': 'application/json'
    }
  })
  console.log(res.data);
 }
  return (
   <div>
    <button onClick={handleClick}>Click this</button>
   </div>
  )
}
