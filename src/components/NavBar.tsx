import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';

const NavBar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <a href="https://geyser.fund" target="_blank" rel="noopener noreferrer">
            <img 
              src="https://storage.googleapis.com/geyser-projects-media/app/logo-name-dark.svg" 
              alt="Geyser Logo" 
              className="geyser-logo"
            />
          </a>
          {/* <h1>{title}</h1> */}
        </div>
        
        <div className="navbar-links">
          <a href="https://geyser.fund" target="_blank" rel="noopener noreferrer" className="navbar-link">
            Discover More Projects
          </a>
          <a href="https://about.geyser.fund" target="_blank" rel="noopener noreferrer" className="navbar-link">
            About
          </a>
          <a href="https://geyser.fund/launch/start" target="_blank" rel="noopener noreferrer" className="primary-button">
            Start your own project
          </a>
        </div>
        
        <div className="navbar-actions">
          <ThemeToggle />
          <button 
            className="mobile-menu-button" 
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <a 
          href="https://geyser.fund" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="navbar-link"
          onClick={closeMobileMenu}
        >
          Discover More Projects
        </a>
        <a 
          href="https://about.geyser.fund" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="navbar-link"
          onClick={closeMobileMenu}
        >
          About
        </a>
        <a 
          href="https://geyser.fund/create" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="primary-button"
          onClick={closeMobileMenu}
        >
          Start your own project
        </a>
      </div>
    </nav>
  );
};

export default NavBar; 