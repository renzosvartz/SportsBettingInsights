// Navigation.js
import React from 'react';

const Navigation = () => {
  return (
    <nav className="navbar">
      <ul>
        <li className="nav-item"><a href="/">Home</a></li>
        <li className="nav-item"><a href="/" style={{ textDecoration: 'line-through' }}>User Dashboard</a></li>
        <li className="nav-item"><a href="/" style={{ textDecoration: 'line-through' }}>Betting Insights and Analysis</a></li>
        <li className="nav-item"><a href="/" style={{ textDecoration: 'line-through' }}>Community</a></li>
        <li className="nav-item"><a href="/" style={{ textDecoration: 'line-through' }}>Tools</a></li>
      </ul>
    </nav>
  );
};

export default Navigation;