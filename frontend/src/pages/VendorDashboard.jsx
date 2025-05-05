import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function VendorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [vendorData, setVendorData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="vendor-dashboard-wrapper">
      
      <button className="mobile-menu-toggle" onClick={toggleSidebar}>
        <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="close-button" onClick={toggleSidebar}>
          &times;
        </button>
        <nav>
          <ul>
            <li><Link to="/vendordashboard">Dashboard</Link></li>
            <li><Link to="/vendor/orders">Orders</Link></li>
            <li><Link to="/vendor/products">Products</Link></li>
            <li><Link to="/vendor/profile">Profile</Link></li>
          </ul>
        </nav>
      </aside>

      <main className="vendor-main-content">
        <h1 className="greeting">Welcome, {vendorData?.name || "Vendor"}</h1>
        <p>This is your vendor dashboard page.</p>
      </main>
      
    </div>
  );
}

export default VendorDashboard;
