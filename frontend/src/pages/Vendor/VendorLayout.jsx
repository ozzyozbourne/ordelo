import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

function VendorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user")); 
    const token = storedUser?.token;
    const role = storedUser?.role;

    if (!token || role !== "vendor") {
      localStorage.removeItem("user");
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Check which page is active
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <div className="vendor-layout-wrapper">
      <div className="vendor-body">
        {/* Sidebar */}
        <aside className="vendor-sidebar">
          <div className="vendor-sidebar-logo">Ordelo Vendor</div>
          <nav className="vendor-nav">
            <ul>
              <li>
                <Link 
                  to="/vendor/dashboard" 
                  className={isActive("/dashboard") ? "vendor-nav-link active" : "vendor-nav-link"}
                >
                  <i className="fas fa-tachometer-alt"></i>
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/vendor/orders" 
                  className={isActive("/orders") ? "vendor-nav-link active" : "vendor-nav-link"}
                >
                  <i className="fas fa-shopping-cart"></i>
                  <span>Orders</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/vendor/store" 
                  className={isActive("/store") ? "vendor-nav-link active" : "vendor-nav-link"}
                >
                  <i className="fas fa-store"></i>
                  <span>Store</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/vendor/add-inventory" 
                  className={isActive("/add-inventory") ? "vendor-nav-link active" : "vendor-nav-link"}
                >
                  <i className="fas fa-plus-circle"></i>
                  <span>Add Products</span>
                </Link>
              </li>
            </ul>
          </nav>
          <div className="vendor-sidebar-logout">
            <button onClick={handleLogout} className="btn vendor-logout-btn">
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </aside>
        {/* Main Content */}
        <main className="vendor-main-content">
          <Outlet />
        </main>
      </div>
      {/* Footer */}
      <footer className="vendor-footer">
        <p>© {new Date().getFullYear()} Ordelo Vendor Platform</p>
      </footer>
    </div>
  );
}

export default VendorLayout;