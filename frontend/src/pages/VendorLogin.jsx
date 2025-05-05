import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function VendorLogin() {
  const [userData, setUserData] = useState({
    email: "",
    password: "",
    role: "vendor", 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from || "/vendor/dashboard";

  const API_URL = "http://localhost:8080/login";

  const handleInputChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      let data;
      const text = await response.text();

      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      if (response.ok) {
        login({
          id: data._id,
          email: userData.email,
          role: data.role,
          token: data.access_token,
          tokenType: data.token_type,
          expiresIn: data.expires_in,
        });

        navigate(from, { replace: true });
      } else {
        setError(data.error || data.message || "Login failed. Please try again.");
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
          <h1 className="auth-title">Welcome Back!</h1>
          <p className="auth-subtitle">Log in to access your recipes and shopping lists</p>

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
            </div>

            <button 
              type="submit" 
              className="btn btn-primary auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? <span className="button-loader"></span> : <>Log In</>}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account?</p>
            <Link to="/vendor/register" className="register-option">
              <i className="fas fa-user"></i> Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorLogin;
