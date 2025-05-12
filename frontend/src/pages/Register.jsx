import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function UserRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/register", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          email: formData.email,
          password_hash: formData.password,
          role: "user",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        login({
          id: data._id || null,
          name: formData.name,
          email: formData.email,
          role: data.role || "user",
          token: data.access_token,
          expires_in: data.expires_in || "900"
        });
        navigate('/', { replace: true });
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join Ordelo to save recipes and create shopping lists</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your address"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
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
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Create a password"
                  minLength="8"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Confirm your password"
                  minLength="8"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? <span className="button-loader"></span> : <>Create Account</>}
              </button>
            </div>
          </form>

          <div className="auth-footer">
            <p>Already have an account?</p>
            <Link to="/login" className="login-link">
              <i className="fas fa-sign-in-alt"></i> Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserRegister;