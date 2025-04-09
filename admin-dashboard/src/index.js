// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import CSS Files
import './admin-styles.css'; // Your admin styles MUST be imported
// import './index.css'; // Optional: if you have global base styles like resets
import '@fortawesome/fontawesome-free/css/all.min.css'; // Font Awesome

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);