import { Link } from "react-router-dom";
import ThemeToggle from './ThemeToggle';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-container">
          {/* Your existing footer sections */}
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
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                <i className="fab fa-pinterest-p"></i>
              </a>
            </div>
          </div>

          {/* Your existing footer sections */}
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/saved-recipes">Saved Recipes</Link></li>
              <li><Link to="/shopping-list">Shopping List</Link></li>
              <li><Link to="/orders">Orders</Link></li>
            </ul>
          </div>


          <div className="footer-section">
            <h3>Help & Support</h3>
            <ul className="footer-links">
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">For Vendors</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="copyright">
            <p>&copy; {new Date().getFullYear()} Ordelo. All rights reserved.</p>
          </div>
          <ThemeToggle /> 
        </div>
      </div>
    </footer>
  );
}

export default Footer;