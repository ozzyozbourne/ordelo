// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // This would be replaced with actual API call by the API team
      // Placeholder for API call:
      /*
      const response = await fetch('https://api.ordelo.com/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.message || "Request failed. Please try again.");
      }
      */
      
      // For development - simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Password reset error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container forgot-password-container">
        <div className="auth-content">
          <h1 className="auth-title">Reset Password</h1>
          
          {isSubmitted ? (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              <h2>Email Sent!</h2>
              <p>
                We've sent password reset instructions to: <br />
                <strong>{email}</strong>
              </p>
              <p className="instructions">
                Please check your email and follow the instructions to reset your password.
                If you don't see the email, check your spam folder.
              </p>
              <div className="auth-footer">
                <Link to="/login" className="btn btn-primary">
                  <i className="fas fa-arrow-left"></i> Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="auth-subtitle">
                Enter the email address associated with your account and we'll send you instructions to reset your password.
              </p>
              
              {error && <div className="auth-error">{error}</div>}
              
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
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
                      <i className="fas fa-paper-plane"></i> Send Reset Instructions
                    </>
                  )}
                </button>
              </form>
              
              <div className="auth-footer">
                <Link to="/login" className="back-to-login">
                  <i className="fas fa-arrow-left"></i> Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;