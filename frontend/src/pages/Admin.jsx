
import axios from "axios"
import  { useState } from "react";
const AddUser = () => {
  const[userData, setBookData]= useState({
    user_name: "",
    user_address: "",
    email: "",
    password: "",
    saved_recipe: "",
    role: "",
    created_at:""
  })
  
  let { user_name, user_address, email, password, saved_recipe, role, created_at}= userData;
  const onChangeHandler=(e)=>{
    setBookData({
      ...userData,
      [e.target.name] : e.target.value
    })
  }

  const onSubmitHandler = async(e)=>{
    try{
    e.preventDefault();
   // let tokenData = localStorage.getItem("token");
    //tokenData= JSON.parse(tokenData)
   /* let {data}= await axios.post("/api/admin/add", userData, {
      headers:{
      'auth-token': tokenData.token
      }
    })
    console.log(tokenData)*/
    let { data } = await axios.post("http://localhost:8080/admin/add", userData);
    console.log(data);
    }
    catch(error){
    console.log(error);
    }
  }
  return (
    <>
    <div className='Register'>
        <center>
    <h1>Register Users Here: </h1><br/>
    <form className="form" onSubmit={onSubmitHandler}>
  
  <input type="text" placeholder="Enter Name" name="user_name" onChange={onChangeHandler} value={user_name} required />
  <br /><br /><br />
  
  <input type="text" placeholder="Enter Address" name="user_address" onChange={onChangeHandler} value={user_address} required />
  <br /><br /><br />
  
  <input type="email" placeholder="Enter Email" name="email" onChange={onChangeHandler} value={email} required />
  <br /><br /><br />
  
  <input type="password" placeholder="Enter Password" name="password" onChange={onChangeHandler} value={password} required />
  <br /><br /><br />
  
  <input type="text" placeholder="Enter Saved Recipe" name="saved_recipe" onChange={onChangeHandler} value={saved_recipe} required />
  <br /><br /><br />
  
  <input type="text" placeholder="Enter Role" name="role" onChange={onChangeHandler} value={role} required />
  <br /><br /><br />
  
  <input type="datetime-local" placeholder="Enter Creation Date" name="created_at" onChange={onChangeHandler} value={created_at} required />
  <br /><br /><br /><br />
  <button type="submit">Register</button>
</form>

    </center>    
    </div>  
    </>
  )
}
export default AddUser