// src/App.js
import React, { useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Layout & Helpers
import ScrollToTop from './components/ScrollToTop'; // Import ScrollToTop
import AdminDashboardLayout from './layouts/AdminDashboardLayout';

// Context
import { AuthProvider, useAuth } from './context/AuthContext'; // Import AuthProvider & useAuth

// Pages
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import IngredientManagementPage from './pages/admin/IngredientManagementPage';
import RecipeManagementPage from './pages/admin/RecipeManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import VendorManagementPage from './pages/admin/VendorManagementPage';



// Protected Route Component for Admin
function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Optional: Show loading indicator while auth is checked
    return <div style={{padding: '3rem', textAlign: 'center'}}>Checking authentication...</div>;
  }

  if (!user || user.role !== 'admin') {
    // Redirect non-admins to login page, saving the attempted location
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  // User is authenticated admin, render the requested component
  return children;
}


// Component to structure Admin routes within the layout
function AdminRoutes() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProtectedAdminRoute> {/* Wrap admin section with protection */}
      <AdminDashboardLayout isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
        <Routes> {/* Nested Routes for admin pages */}
          <Route index element={<Navigate to="users" replace />} /> {/* Default to users */}
          <Route path="users" element={<UserManagementPage />} />
          <Route path="vendors" element={<VendorManagementPage />} />
          <Route path="recipes" element={<RecipeManagementPage />} />
          <Route path="ingredients" element={<IngredientManagementPage />} />
          {/* Add more admin routes here (e.g., settings) */}
          <Route path="*" element={<NotFoundPage />} /> {/* Catch-all within admin */}
        </Routes>
      </AdminDashboardLayout>
    </ProtectedAdminRoute>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider> {/* Provide Auth context to the entire app */}
      <Router>
        <ScrollToTop /> {/* Ensures scrolling to top on navigation */}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          {/* Add other public routes here if necessary */}

          {/* Admin Routes - Handled by AdminRoutes component */}
          <Route path="/admin/*" element={<AdminRoutes />} />

          {/* Redirect root path */}
          <Route path="/" element={<Navigate to="/admin/users" replace />} /> {/* Or redirect to login: <Navigate to="/login" replace /> */}

          {/* Catch-all 404 Not Found Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;