import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);

  const from = location.state?.from || '/admin/users';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:8080/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: "admin"
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Login failed");
      }

      if (!contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(text || "Unexpected server response");
      }

      const data = await response.json();

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);

      login({
        id: data._id || null,
        email: formData.email,
        role: data.role || "admin",
        token: data.access_token,
        token_type: data.token_type || '',
        expires_in: data.expires_in || '',
      });

      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login error", error);
      setError(error.message || "An unexpected error occurred.");
    }
  };

  return (
    <div style={{ padding: '3rem', maxWidth: '400px', margin: '5rem auto', textAlign: 'center', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h1>Admin Login</h1>
      <p>Enter your admin credentials to access the panel.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          style={{ padding: '0.8rem' }}
          value={formData.email}
          onChange={handleInputChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          style={{ padding: '0.8rem' }}
          value={formData.password}
          onChange={handleInputChange}
        />
        <button type="submit" className="btn btn-primary">
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
