import React from 'react';
import styles from '../styles/HeroSection.module.css'; // CSS-Datei für Hero-Styles

const HeroSection = () => {
  return (
    <div className={styles.heroContainer}>
      <video 
        src="/hero-video.mp4" // Das Video kommt aus dem Public-Ordner
        className={styles.heroVideo} 
        autoPlay 
        loop 
        muted
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default HeroSection;

