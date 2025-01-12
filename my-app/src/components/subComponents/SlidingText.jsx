import React, { useState, useEffect } from "react";
import styles from "../../styles/SlidingText.module.css";

const SlidingText = () => {
  const texts = [
    "Versandkostenfrei ab 50€",
    "Lieferzeit: 3-5 Werktage",
    "Jetzt anmelden für exklusive Rabatte!"
  ];
  const [activeIndex, setActiveIndex] = useState(0); // Startet mit dem ersten Text

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % texts.length); // Zyklischer Wechsel
    }, 4000); // Wechsel alle 4 Sekunden
    return () => clearInterval(interval); // Aufräumen bei Komponentendemontage
  }, []);

  return (
    <div className={styles.SlidingText}>
      {texts.map((text, index) => (
        <span
          key={index}
          className={`${styles.text} ${
            index === activeIndex ? styles.active : styles.inactive
          }`}
        >
          {text}
        </span>
      ))}
    </div>
  );
};

export default SlidingText;

