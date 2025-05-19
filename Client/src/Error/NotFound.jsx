import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound-wrapper">
      <div className="notfound-card">
        <h2 className="notfound-title">404 - Not Found</h2>
        <p className="notfound-message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <button className="action-btn" onClick={() => navigate('/order')}>
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
