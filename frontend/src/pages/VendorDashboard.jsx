import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


function VendorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [vendorData, setVendorData] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user")); 
    const token = storedUser?.token;
    const role = storedUser?.role;

    if (!token || role !== "vendor") {
      localStorage.removeItem("user");
      navigate("/vendor/login");
    } else {
      setVendorData(storedUser);
    }
  }, [navigate]);



  return (
    <div className="vendor-dashboard">

      <div className="main-content">
        <h1 className="greeting">Welcome, {vendorData?.name || "Vendor"}</h1>
      </div>
    </div>
  );
}

export default VendorDashboard;