// src/components/admin/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="loading-indicator">
    <div className="spinner"></div>
    <p>{message}</p>
  </div>
);

export default LoadingSpinner;