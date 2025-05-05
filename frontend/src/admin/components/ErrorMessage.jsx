
import React from 'react';

const ErrorMessage = ({ message = "An error occurred." }) => (
  <div className="error-message">
    <i className="fas fa-exclamation-triangle"></i> {message}
  </div>
);

export default ErrorMessage;