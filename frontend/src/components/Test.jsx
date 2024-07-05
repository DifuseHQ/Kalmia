import { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";


export default function Test() {

  const {user}  = useContext(AuthContext);
  console.log(user);
  console.log("user is : " , user.username);
  return (
    <div>
      <h1>test page</h1>
    </div>
  );
}
