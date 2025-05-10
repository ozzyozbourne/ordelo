import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "/Users/zohaahmed/ordelo/ordelo/frontend/src/context/AuthContext.jsx";
import { jwtDecode } from "jwt-decode";

function VendorDashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [decoded, setDecoded] = useState(null);

  // Redirect if not a vendor
  useEffect(() => {
    if (!loading && (!user || user.role !== "vendor")) {
      navigate("/vendor/login");
    }
  }, [user, loading, navigate]);

  // Decode token safely
  useEffect(() => {
    if (user?.token) {
      try {
        const decodedToken = jwtDecode(user.token);
        setDecoded(decodedToken);
      } catch (err) {
        console.error("Failed to decode token:", err.message);
        setDecoded(null);
      }
    }
  }, [user]);

  if (loading || !user || !user.token || !decoded) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="vendor-dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {decoded.name}</h1>
        <button className="btn btn-secondary" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <p>Email: {user.email}</p>
        <p>Address: {decoded.address}</p>

        {/* Add dashboard content like store stats, orders, etc. */}
      </main>
    </div>
  );
}

export default VendorDashboard;
