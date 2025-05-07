import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // import useAuth
import { jwtDecode } from "jwt-decode";

function VendorDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth(); 


   const decoded = jwtDecode(user.token);
   const name = decoded.name;
   const address = decoded.address;
  const email = user.email;

  useEffect(() => {
    if (!loading && (!user || user.role !== "vendor")) {
      navigate("/vendor/login");
    }
  }, [user, loading, navigate]);
  if (loading) {
    return <div className="profile-page">Loading...</div>;
  }

  return (
    <div>
      <h1 className="greeting">Welcome, {user?.name || "Vendor"}</h1>
      <p>This is your vendor dashboard page.</p>
    </div>
  );
}

export default VendorDashboard;
