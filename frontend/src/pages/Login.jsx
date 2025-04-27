// Enhanced Login.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Check if this is an admin login
  const isAdminLogin = location.pathname.startsWith("/admin");

  // Get the redirect path from location state or default
  const from = location.state?.from || "/";

  const handleInputChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user types
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // For admin login - use the simulated admin login
      if (isAdminLogin) {
        const success = login(userData);
        if (success) {
          navigate("/admin/users", { replace: true });
        } else {
          setError("Invalid admin credentials");
        }
      } else {
        // Regular user/vendor login
        // This would be replaced with actual API call by the API team
        // Placeholder for API call:
        /*
        const response = await fetch('https://api.ordelo.com/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          login({
            ...data.user,
            token: data.token,
          });
          navigate(from, { replace: true });
        } else {
          setError(data.message || "Login failed. Please try again.");
        }
        */
        
        // Temporary mock login for development:
        if (userData.email === "user@example.com" && userData.password === "password123") {
          login({
            id: "u1",
            name: "Test User",
            email: userData.email,
            role: "user",
            token: "mock-jwt-token",
          });
          navigate(from, { replace: true });
        } else if (userData.email === "vendor@example.com" && userData.password === "password123") {
          login({
            id: "v1",
            name: "Test Vendor",
            email: userData.email,
            role: "vendor",
            token: "mock-jwt-token",
          });
          navigate(user?.role === 'vendor' ? '/vendordashboard' : '/');
        } else {
          setError("Invalid email or password");
        }
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          <h1 className="auth-title">{isAdminLogin ? "Admin Login" : "Welcome Back!"}</h1>
          <p className="auth-subtitle">
            {isAdminLogin 
              ? "Enter your credentials to access the admin panel" 
              : "Log in to access your recipes, shopping lists, and more"}
          </p>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={userData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
              />
              {!isAdminLogin && (
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot Password?
                </Link>
              )}
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="button-loader"></span>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i> {isAdminLogin ? "Admin Login" : "Log In"}
                </>
              )}
            </button>
          </form>
          
          {!isAdminLogin && (
            <div className="auth-footer">
              <p>Don't have an account?</p>
              <div className="register-options">
                <Link to="/register/user" className="register-option">
                  <i className="fas fa-user"></i>
                  <span>Register as User</span>
                  <i className="fas fa-chevron-right"></i>
                </Link>
                <Link to="/register/vendor" className="register-option">
                  <i className="fas fa-store"></i>
                  <span>Register as Vendor</span>
                  <i className="fas fa-chevron-right"></i>
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <div className="auth-image">
          {/* This div will be styled with a background image */}
        </div>
      </div>
    </div>
  );
}

export default Login;