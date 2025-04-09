// src/components/admin/AdminSidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom'; // Use NavLink for active class
import { useAuth } from '../../context/AuthContext'; // Import useAuth

const AdminSidebar = ({ isOpen, closeSidebar }) => {
  const { logout } = useAuth(); // Get logout function

  const handleLogout = () => {
    logout();
    // AuthContext logout might handle redirect, or you can do it here if needed
    // navigate('/login');
    closeSidebar(); // Close sidebar if open on mobile
  };

  // Close sidebar when a link is clicked on mobile view
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) { // Check if potentially on mobile view
        closeSidebar();
    }
  }

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Use text-gradient class for the logo style */}
      <div className="admin-sidebar-logo text-gradient">Ordelo Admin</div>
      <nav className="admin-nav">
        <NavLink
            to="/admin/users"
            className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            onClick={handleLinkClick}
        >
          <i className="fas fa-users"></i>
          <span>Users</span>
        </NavLink>
        <NavLink
            to="/admin/vendors"
            className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            onClick={handleLinkClick}
        >
          <i className="fas fa-store"></i>
          <span>Vendors</span>
        </NavLink>
        <NavLink
            to="/admin/recipes"
            className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            onClick={handleLinkClick}
        >
          <i className="fas fa-utensils"></i>
          <span>Recipes</span>
        </NavLink>
        {/* Add more links here (e.g., Settings, Analytics) */}
        {/* Example:
        <NavLink to="/admin/settings" className={...}>
          <i className="fas fa-cog"></i>
          <span>Settings</span>
        </NavLink>
        */}
      </nav>
      <div className="admin-sidebar-footer">
         <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%' }}>
            <i className="fas fa-sign-out-alt"></i> Logout
         </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;