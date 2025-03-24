import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

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
            to="/saved-recipes" 
            className={location.pathname === "/saved-recipes" ? "active" : ""}
          >
            <i className="fas fa-heart"></i> Saved
          </Link>
          <Link 
            to="/shopping-list" 
            className={location.pathname === "/shopping-list" ? "active" : ""}
          >
            <i className="fas fa-shopping-basket"></i> Shopping List
          </Link>
          <Link 
            to="/orders" 
            className={location.pathname === "/orders" ? "active" : ""}
          >
            <i className="fas fa-box"></i> Orders
          </Link>
        </nav>

        <button className="vendor-login">
          <i className="fas fa-store"></i> Vendor Login
        </button>

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
          <Link to="/saved-recipes">
            <i className="fas fa-heart"></i> Saved Recipes
          </Link>
          <Link to="/shopping-list">
            <i className="fas fa-shopping-basket"></i> Shopping List
          </Link>
          <Link to="/orders">
            <i className="fas fa-box"></i> Orders
          </Link>
          <button className="vendor-login-mobile">
            <i className="fas fa-store"></i> Vendor Login
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;