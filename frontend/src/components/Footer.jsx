// src/components/Footer.jsx
import { Link } from "react-router-dom";
import ThemeToggle from './ThemeToggle';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-container">
          <div className="footer-section">
            <div className="footer-logo">Ordelo</div>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/saved-recipes">Saved Recipes</Link></li>
              <li><Link to="/shopping-list">Shopping List</Link></li>
              <li><Link to="/orders">Orders</Link></li>
              <ThemeToggle />
            </ul>
          </div>

          <div className="footer-section">
            <h3>Help & Support</h3>
            <ul className="footer-links">
              <li><Link to="/help-support#faq">FAQ</Link></li>
              <li><Link to="/help-support#contact">Contact Us</Link></li>
              <li><Link to="/help-support#privacy">Privacy Policy</Link></li>
              <li><Link to="/help-support#terms">Terms of Service</Link></li>
              <li><Link to="/help-support#vendors">For Vendors</Link></li>
              <li><Link to="/help-support#aboutus">About Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="copyright">
            <p>&copy; {new Date().getFullYear()} Ordelo. Built by students as an educational project. No commercial activity involved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
