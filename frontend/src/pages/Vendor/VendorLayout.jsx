import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext"; // Add this

function VendorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth(); // useAuth for logout

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user")); 
    const token = storedUser?.token;
    const role = storedUser?.role;

    if (!token || role !== "vendor") {
      localStorage.removeItem("user");
      navigate("/vendor/login");
    }
  }, [navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout(); // logout from auth context
    navigate("/"); // redirect to home
  };

  return (
    <div className="vendor-layout-wrapper">

      {/* Header */}
      <header className="vendor-header">
        <h2>Vendor Panel</h2>
        <button onClick={handleLogout}>Logout</button>
      </header>

      {/* Sidebar Toggle Button (for mobile) */}
      <button className="mobile-menu-toggle" onClick={toggleSidebar}>
        <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      {/* Body (Sidebar + Content) */}
      <div className="vendor-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <nav>
            <ul>
              <li><Link to="/vendor/dashboard">Dashboard</Link></li>
              <li><Link to="/vendor/orders">Orders</Link></li>
              <li><Link to="/vendor/store">Store</Link></li>
              <li><Link to="/vendor/inventory">Products</Link></li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="vendor-main-content">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="vendor-footer">
        <p>© 2025 Ordelo Vendor Platform</p>
      </footer>
    </div>
  );
}

export default VendorLayout;
