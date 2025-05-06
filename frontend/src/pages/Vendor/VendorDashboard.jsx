import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // import useAuth

function VendorDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth(); // get user from AuthContext

  useEffect(() => {
    if (!loading && (!user || user.role !== "vendor")) {
      navigate("/vendor/login");
    }
  }, [user, loading, navigate]);

  return (
    <div>
      <h1 className="greeting">Welcome, {user?.email || "Vendor"}</h1>
      <p>This is your vendor dashboard page.</p>
    </div>
  );
}

export default VendorDashboard;
