import React from 'react';
import styles from '../styles/Banner.module.css'; // Stelle sicher, dass du die CSS-Datei hast

const Banner = () => {
  return (
    <div className={styles.bannerContainer}>
      <img
        src="/banner.png" // Passe den Pfad an dein Bild an
        alt="Banner"
        className={styles.bannerImage}
      />
    </div>
  );
};

export default Banner;

