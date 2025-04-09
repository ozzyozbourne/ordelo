// src/layouts/AdminDashboardLayout.jsx
import React from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';
import Footer from '../components/Footer'; // Import the reused Footer

const AdminDashboardLayout = ({ children, isSidebarOpen, setIsSidebarOpen }) => {

  // Function to toggle sidebar state (passed from App.js)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    // Wrapper div for full height layout including footer
    <div className="admin-dashboard-wrapper">
      {/* Main dashboard area (Sidebar + Content) */}
      <div className="admin-dashboard">
        {/* Button to toggle sidebar on mobile */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>

        {/* Sidebar Component */}
        <AdminSidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />

        {/* Main Content Area where page components render */}
        <main className="admin-main-content">
          {children} {/* Page component (e.g., UserManagementPage) goes here */}
        </main>
      </div>

      {/* Reused Footer Component */}
      <Footer />
    </div>
  );
};

export default AdminDashboardLayout;