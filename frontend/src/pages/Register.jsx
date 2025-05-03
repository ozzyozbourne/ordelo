// src/pages/Register.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const { type } = useParams(); // 'user' or 'vendor'
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Vendor-specific fields
    storeName: "",
    storeAddress: "",
    storeDescription: "",
  });

  // Validate type parameter
  useEffect(() => {
    if (type !== 'user' && type !== 'vendor') {
      navigate('/register/user', { replace: true });
    }
  }, [type, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user types
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // This would be replaced with actual API call by the API team
      // Placeholder for API call:
      /*
      const endpoint = type === 'vendor' ? 'register-vendor' : 'register-user';
      const response = await fetch(`https://api.ordelo.com/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (type === 'vendor') {
          // For vendors - just show success message, no auto-login
          setIsSubmitted(true);
        } else {
          // For regular users - auto-login after successful registration
          login({
            ...data.user,
            token: data.token,
          });
          navigate('/', { replace: true });
        }
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
      */

      // For development - simulate successful registration
      console.log(`Registering ${type}:`, formData);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Real backend register
      const endpoint = type === 'vendor' ? 'register-vendor' : 'register-user';
      const response = await fetch(`http://localhost:7001/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (type === 'vendor') {
          setIsSubmitted(true);
        } else {
          login({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            token: data.token,
          });
          navigate('/', { replace: true });
        }
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

  // If registration is successful for vendors
  if (isSubmitted && type === 'vendor') {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-content">
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              <h2>Application Submitted!</h2>
              <p>
                Thank you for registering with Ordelo as a vendor.
              </p>
              <p className="instructions">
                Your application has been submitted for review. Our team will review your information and get back to you via email at <strong>{formData.email}</strong> within 1-3 business days.
              </p>
              <div className="auth-footer">
                <Link to="/login" className="btn btn-primary">
                  <i className="fas fa-arrow-left"></i> Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          <h1 className="auth-title">
            {type === 'vendor' ? "Vendor Registration" : "Create Account"}
          </h1>
          <p className="auth-subtitle">
            {type === 'vendor'
              ? "Join Ordelo as a vendor to sell your products"
              : "Join Ordelo to save recipes, create shopping lists, and more"}
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Common fields for both user and vendor */}
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
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your phone number"
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

            {/* Vendor-specific fields */}
            {type === 'vendor' && (
              <div className="vendor-fields">
                <h3>Store Information</h3>

                <div className="form-group">
                  <label htmlFor="storeName">Store Name</label>
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your store name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="storeAddress">Store Address</label>
                  <input
                    type="text"
                    id="storeAddress"
                    name="storeAddress"
                    value={formData.storeAddress}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your store address"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="storeDescription">Store Description</label>
                  <textarea
                    id="storeDescription"
                    name="storeDescription"
                    value={formData.storeDescription}
                    onChange={handleInputChange}
                    placeholder="Tell us about your store"
                    rows="3"
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="button-loader"></span>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i> {type === 'vendor' ? 'Submit Application' : 'Create Account'}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="auth-footer">
            <p>Already have an account?</p>
            <Link to="/login" className="login-link">
              <i className="fas fa-sign-in-alt"></i> Login
            </Link>

            {/* Toggle between user and vendor registration */}
            {type === 'user' ? (
              <p className="toggle-registration">
                Want to sell on Ordelo? <Link to="/register/vendor">Register as a vendor</Link>
              </p>
            ) : (
              <p className="toggle-registration">
                Want to use Ordelo for shopping? <Link to="/register/user">Register as a user</Link>
              </p>
            )}
          </div>
        </div>

        <div className="auth-image">
          {/* This div will be styled with a background image */}
        </div>
      </div>
    </div>
  );
}

export default Register;