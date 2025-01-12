import React from 'react';
import styles from '../styles/Footer.module.css'; // CSS-Modul für den Footer

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Navigation */}
        <div className={styles.navigation}>
          <h4>Navigation</h4>
          <ul>
            <li><a href="/impressum">Impressum</a></li>
            <li><a href="/datenschutz">Datenschutz</a></li>
            <li><a href="/kontakt">Kontakt</a></li>
          </ul>
        </div>

        {/* Social Media */}
        <div className={styles.socialMedia}>
          <h4>Folge uns</h4>
          <div className={styles.icons}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <img src="/Instagram.png" alt="Instagram" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <img src="/Facebook.png" alt="Facebook" />
            </a>
          </div>
        </div>

        {/* Newsletter */}
        <div className={styles.newsletter}>
          <h4>Newsletter abonnieren</h4>
          <form>
            <input
              type="email"
              placeholder="Deine Email"
              required
              className={styles.emailInput}
            />
            <button type="submit" className={styles.subscribeButton}>Anmelden</button>
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div className={styles.copyright}>
        <p>&copy; Ancient Veda Copyright 2024. Alle Rechte vorbehalten.</p>
      </div>
    </footer>
  );
};

export default Footer;

