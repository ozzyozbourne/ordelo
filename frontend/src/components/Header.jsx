// src/components/Header.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Handle logout
  const handleLogout = () => {
    logout(); // This clears the user and localStorage
  };

  return (
    <header className={`header ${isScrolled ? "scrolled" : ""}`}>
      <div className="container header-container">
        <Link to="/" className="logo">
          <span className="text-gradient">Ordelo</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            <i className="fas fa-home"></i> Recipes
          </Link>
          <Link 
            to="/shopping-list" 
            className={location.pathname === "/shopping-list" ? "active" : ""}
          >
            <i className="fas fa-shopping-basket"></i> Grocery List
          </Link>
          <Link 
            to="/shopping" 
            className={location.pathname === "/shopping" ? "active" : ""}
          >
            <i className="fas fa-store"></i> Shopping
          </Link>
        </nav>

        {/* Login/Account Button */}
        {user ? (
          <div className="account-dropdown">
            <button className="account-btn">
              <i className="fas fa-user"></i> My Account
            </button>
            <div className="dropdown-content">
              <Link to="/profile">Profile</Link>
              <Link to="/orders">
               Orders
              </Link>
              <Link to="/saved-recipes">Saved Recipes</Link>
              {user.role === 'vendor' && (
                <Link to="/vendor/dashboard">Vendor Dashboard</Link>
              )}
              <button onClick={handleLogout} className="logout-btn">
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        ) : (
          <Link to="/login" className="login-btn">
            <i className="fas fa-sign-in-alt"></i> Login
          </Link>
        )}

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <i className={isMobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <Link to="/">
            <i className="fas fa-home"></i> Recipes
          </Link>
          <Link to="/shopping-list">
            <i className="fas fa-shopping-basket"></i> Shopping List
          </Link>
          <Link to="/shopping">
            <i className="fas fa-store"></i> Shopping
          </Link>
          {user ? (
            <>
              <Link to="/profile">
                <i className="fas fa-user"></i> Profile
              </Link>
              <Link to="/orders">
                <i className="fas fa-box"></i> Orders
              </Link>
              <Link to="/saved-recipes">
                <i className="fas fa-heart"></i> Saved Recipes
              </Link>
              {user.role === 'vendor' && (
                <Link to="/vendor/dashboard">
                  <i className="fas fa-store-alt"></i> Vendor Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="logout-btn-mobile">
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="login-btn-mobile">
              <i className="fas fa-sign-in-alt"></i> Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;