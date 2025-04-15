// src/components/Footer.jsx
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-container">
          <div className="footer-section">
            {/* Or use text-gradient class */}
            <div className="footer-logo">Ordelo</div>
            <p>Plan, Shop & Cook—All in One App. Explore endless recipes, build your shopping list instantly, and save on every order.</p>
            <div className="social-links">
              <a href="#!" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#!" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#!" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#!" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                <i className="fab fa-pinterest-p"></i>
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              {/* Update links if they make sense in admin context or remove */}
              <li><Link to="/admin/users">Users</Link></li>
              <li><Link to="/admin/vendors">Vendors</Link></li>
              <li><Link to="/admin/recipes">Recipes</Link></li>
              <li><Link to="/admin/ingredients">Ingredients</Link></li>
              {/* Remove links irrelevant to admin */}
              {/* <li><Link to="/saved-recipes">Saved Recipes</Link></li> */}
              {/* <li><Link to="/shopping-list">Shopping List</Link></li> */}
              {/* <li><Link to="/orders">Orders</Link></li> */}
            </ul>
          </div>

          <div className="footer-section">
            <h3>Platform</h3>
            <ul className="footer-links">
              {/* Replace with admin relevant links or keep generic */}
              <li><a href="#!">Settings</a></li>
              <li><a href="#!">Analytics</a></li>
              <li><a href="#!">System Status</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Help & Support</h3>
            <ul className="footer-links">
              <li><a href="#!">Admin FAQ</a></li>
              <li><a href="#!">Contact Support</a></li>
              <li><a href="#!">Privacy Policy</a></li>
              <li><a href="#!">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="copyright">
          <p>© {new Date().getFullYear()} Ordelo Admin Panel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;