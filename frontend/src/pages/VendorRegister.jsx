import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function VendorRegister() {
  const [vendorData, setVendorData] = useState({
    name: "",
    address: "",
    email: "",
    password: "",
    storeName: "",
    storeType: "",
    role: "vendor", // ✅ Automatically set role here
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_URL = "http://localhost:8080/register"; // Adjust if needed

  const handleInputChange = (e) => {
    setVendorData({
      ...vendorData,
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vendorData),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Redirect to Vendor Dashboard on successful registration
        navigate("/vendor/dashboard");
      } else {
        setError(data.error || data.message || "Registration failed. Please try again.");
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
          <h1 className="auth-title">Vendor Registration</h1>
          <p className="auth-subtitle">Register your store and start selling today!</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={vendorData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={vendorData.address}
                onChange={handleInputChange}
                required
                placeholder="Enter your address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={vendorData.email}
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
                value={vendorData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="storeName">Store Name</label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={vendorData.storeName}
                onChange={handleInputChange}
                required
                placeholder="Enter your store name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="storeType">Store Type</label>
              <input
                type="text"
                id="storeType"
                name="storeType"
                value={vendorData.storeType}
                onChange={handleInputChange}
                required
                placeholder="Enter store type (Grocery)"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? <span className="button-loader"></span> : <>Register</>}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account?</p>
            <Link to="/login" className="register-option">
              <i className="fas fa-sign-in-alt"></i> Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorRegister;
