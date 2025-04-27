// src/pages/HelpAndSupport.jsx
import { Link } from "react-router-dom";

function HelpAndSupport() {
  return (
    <div className="help-support-page">
      <h1 className="page-title">Help & Support</h1>

      <section id="faq" style={{ marginBottom: "3rem" }}>
        <h2 className="section-title">Frequently Asked Questions (FAQ)</h2>
        <ul>
          <li><strong>What is Ordelo?</strong> Ordelo is a platform that connects recipe discovery with instant grocery shopping.</li>
          <li><strong>Can I customize recipes?</strong> You can save and create new recipes, but existing ones are fixed.</li>
          <li><strong>Can I save my favorite recipes?</strong> Yes! Create an account to save favorites.</li>
          <li><strong>How do vendors join?</strong> Vendors can register through the Vendor Portal and manage their products.</li>
          <li><strong>How do I track my order?</strong> Check the "My Orders" section under your profile.</li>
        </ul>
      </section>

      <section id="contact" style={{ marginBottom: "3rem" }}>
        <h2 className="section-title">Contact Us</h2>
        <p>Have questions or feedback? Reach out to our student team via email: <strong>support@ordelo.students.edu</strong>.</p>
      </section>

      <section id="privacy" style={{ marginBottom: "3rem" }}>
        <h2 className="section-title">Privacy Policy</h2>
        <p>Ordelo values your privacy. We only collect necessary information to improve your experience. We do not sell or share personal data with third parties. Since Ordelo is currently a student project, we follow basic privacy practices in compliance with educational institution guidelines.</p>
      </section>

      <section id="terms" style={{ marginBottom: "3rem" }}>
        <h2 className="section-title">Terms of Service</h2>
        <p>Ordelo is provided "as is" without warranties of any kind. By using the platform, you acknowledge that this is a prototype built for academic purposes and not a commercial product. No financial transactions occur within the platform itself.</p>
      </section>

      <section id="vendors" style={{ marginBottom: "3rem" }}>
        <h2 className="section-title">For Vendors</h2>
        <p>We welcome local stores to join! Register as a vendor, manage your inventory, and connect with users. If you need help onboarding, please email us at <strong>vendors@ordelo.students.edu</strong>.</p>
      </section>

      <section id="aboutus" style={{ marginBottom: "3rem" }}>
        <h2 className="section-title">About Us</h2>
        <p>Ordelo is a passion project built by students at the university level. Our mission is to simplify meal planning and grocery shopping through smart technology. As of today, Ordelo is not generating revenue and exists solely for educational demonstration purposes. Thank you for supporting our vision!</p>
      </section>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/" className="btn btn-primary">Return to Home</Link>
      </div>
    </div>
  );
}

export default HelpAndSupport;
