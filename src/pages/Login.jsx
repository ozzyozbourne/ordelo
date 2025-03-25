import axios from "axios"
import  { useState } from "react";
import { useNavigate  } from "react-router-dom";

const Login = () => {
  const [userData, setUserData]= useState({
    email:"",
    password:"",
  })
  let navigate = useNavigate();
  let {email, password}=userData;

  useNavigate(()=>{
   let token = localStorage.getItem("token");
   if(token){
    token= JSON.parse(token);
    if(token.role==="user"){
      navigate("/home")
    }
    else if(token.role === "vendor"){
      navigate("/vendordashboard")
    }
    else{
      localStorage.removeItem("token");
    }
   }
  }, [])

  const onChangeHandler=(e)=>{
    setUserData({
      ...userData,
      [e.target.name] : e.target.value
    })
   }

   const onSubmitHandler = async(e)=>{
    try{
    e.preventDefault();
    let {data}= await axios.post("http://localhost:7001/login", userData);
    console.log(data);
    let tokenData={
      role: data.role,
      token: data.token
    }
    localStorage.setItem("token", JSON.stringify(tokenData))
    if(data.role === "user"){
      navigate("/home")
    }
    else if(data.role === "vendor"){
      navigate("/vendordashboard")
    }
    else{
    localStorage.removeItem("token")
    }
    }
    catch(error){
    console.log(error);
    }
    }

 return (
  <>
    <div className='Login'>
      <center>
        <h1>Login Here:</h1>
         <form onSubmit={onSubmitHandler} >
      <input type="text"  placeholder="Enter your Email"  name="email" onChange={onChangeHandler} value={email} required/><br/><br/><br/>
      <input type="password" placeholder="Enter your Password" name="password" onChange={onChangeHandler} value={password} required/><br/><br/><br/>
      <button type="submit">Login</button><br /><br />
    </form></center>
    </div>
    </>
  )
};

export default Login;
