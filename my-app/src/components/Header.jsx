import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // useLocation importiert
import styles from '../styles/Header.module.css';
import SlidingText from './subComponents/SlidingText';
import ProfileMenu from './ProfileMenu'; // Profilmenü importieren

const Header = () => {
  const navigate = useNavigate(); // Navigation-Funktion
  const location = useLocation(); // Überwacht Routenwechsel
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Benutzerstatus

  // Überprüfe den Login-Status bei Routenwechsel oder Token-Änderung
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsLoggedIn(!!token);
  }, [location.pathname]); // Aktualisierung bei Pfadänderung

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Token entfernen
    setIsLoggedIn(false); // Benutzerstatus aktualisieren
    navigate('/login'); // Weiterleitung zur Login-Seite
  };

  return (
    <header>
      {/* Obere Leiste */}
      <div className={styles.headerTop}>
        <div className={styles.topLeft}>
          <SlidingText /> {/* Unterkomponente hier */}
        </div>
        <div className="topCenter">
          <Link to="/" className={styles.centerLink}>Ancient Veda</Link>
        </div>
        <div className={styles.topRight}>
          <Link to="/klimaschutz">Klimaschutz</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/support">Support</Link>
          <Link to="/about">About</Link>
        </div>
      </div>

      {/* Hauptleiste */}
      <div className={styles.headerMain}>
        {/* Logo-Bereich */}
        <img src="/logo.png" alt="Logo" className={styles.logoIcon} />

        {/* Navigationslinks */}
        <nav className={styles.navLinks}>
          <Link to="/bestseller">Bestseller</Link>
          <Link to="/categories">Kollektionen</Link>
          <Link to="/angebote">Angebote</Link>
          <Link to="/produkte">Produkte</Link>
          <Link to="/neu">Neu</Link>
        </nav>

        {/* Icons */}
        <div className={styles.headerIcons}>
        {/* Such-Icon */}
        <Link to="/produkte">
         <span className={`${styles.icon} ${styles.searchIcon}`}>
    
         </span>
        </Link>          
          {/* Warenkorb-Icon */}
          <Link to="/cart" className={`${styles.icon} ${styles.cartIcon}`} style={{ cursor: 'pointer' }}>
            <img src="/cart.svg" alt="Warenkorb" style={{ width: '24px', height: '24px' }} />
          </Link>

          {/* User-Icon mit Profilmenü */}
          {isLoggedIn ? (
            <ProfileMenu onLogout={handleLogout} />
          ) : (
            <div
              className={`${styles.icon} ${styles.userIcon}`}
              onClick={() => navigate('/login')} // Weiterleitung zur Login-Seite
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/login')} // Enter für Tastatur-Nutzer
            ></div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

