import React, { useState } from 'react';
import styles from '../styles/Settings.module.css';

const Settings = () => {
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [language, setLanguage] = useState('de');
  const [currency, setCurrency] = useState('EUR');
  const [darkMode, setDarkMode] = useState(false);

  const handleSaveSettings = () => {
    alert('Einstellungen erfolgreich gespeichert!');
  };

  return (
    <div className={styles.settingsContainer}>
      <h1>Einstellungen</h1>

      {/* Benachrichtigungen */}
      <section className={styles.section}>
        <h2>Benachrichtigungen</h2>
        <label>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
          />
          E-Mail-Benachrichtigungen aktivieren
        </label>
        <label>
          <input
            type="checkbox"
            checked={pushNotifications}
            onChange={(e) => setPushNotifications(e.target.checked)}
          />
          Push-Benachrichtigungen aktivieren
        </label>
      </section>

      {/* Sprache & Region */}
      <section className={styles.section}>
        <h2>Sprache & Region</h2>
        <label>
          Sprache:
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="de">Deutsch</option>
            <option value="en">Englisch</option>
          </select>
        </label>
        <label>
          Währung:
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">US-Dollar (USD)</option>
          </select>
        </label>
      </section>

      {/* Datenschutz */}
      <section className={styles.section}>
        <h2>Datenschutz</h2>
        <button onClick={() => alert('Cookies verwalten geöffnet')}>
          Cookies verwalten
        </button>
        <button onClick={() => alert('Daten löschen angefordert')}>
          Daten löschen
        </button>
      </section>

      {/* Zahlungseinstellungen */}
      <section className={styles.section}>
        <h2>Zahlungseinstellungen</h2>
        <button onClick={() => alert('Zahlungsmethoden verwalten geöffnet')}>
          Zahlungsmethoden verwalten
        </button>
      </section>

      {/* Design/Anpassungen */}
      <section className={styles.section}>
        <h2>Design/Anpassungen</h2>
        <label>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
          />
          Dunkler Modus
        </label>
      </section>

      <button onClick={handleSaveSettings} className={styles.saveButton}>
        Einstellungen speichern
      </button>
    </div>
  );
};

export default Settings;

