import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function UserDashboard() {
     let navigate = useNavigate();
     useEffect(() => {
         let verifyToken = async ()=>{
             try {
                 let token = localStorage.getItem("token");
                 token = JSON.parse(token);
                 if (token.role !== "user") {
                     localStorage.removeItem("token");
                     navigate("/login");
                 }
                 let { data } = await axios.get("http://localhost:7001/auth", {
                     headers: {
                         "auth-token": token.token
                     }
                 })
                 if (data.role !== "user") {
                     localStorage.removeItem("token");
                     navigate("/login");
                 }
                 console.log(data);
             } catch (error) {
                 // console.error(error);
                 console.log(error.response.data);
                 localStorage.removeItem("token");
                 navigate("/login");
             }
         }
         verifyToken();
     },[] )

     return (
        <>
        <h1>User Dashboard</h1>
        </>
    )
}
export default UserDashboard;