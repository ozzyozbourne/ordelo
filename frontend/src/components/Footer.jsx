import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-container">
          <div className="footer-section">
            <div className="footer-logo">Ordelo</div>
            <p>Plan, Shop & Cook—All in One App. Explore endless recipes, build your shopping list instantly, and save on every order.</p>
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
            <h3>Categories</h3>
            <ul className="footer-links">
              <li><a href="/#cuisine-italian">Italian</a></li>
              <li><a href="/#cuisine-indian">Indian</a></li>
              <li><a href="/#cuisine-mediterranean">Mediterranean</a></li>
              <li><a href="/#cuisine-mexican">Mexican</a></li>
              <li><a href="/#cuisine-asian">Asian</a></li>
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

        <div className="copyright">
          <p>&copy; {new Date().getFullYear()} Ordelo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;