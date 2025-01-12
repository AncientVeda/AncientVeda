import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/LoginPage.module.css'; // CSS-Modul einbinden

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch("http://localhost:5001/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, sessionId: localStorage.getItem("sessionId") }),
    });

    if (!response.ok) {
      throw new Error("Login fehlgeschlagen. Bitte überprüfe deine Daten.");
    }

    const data = await response.json();
    localStorage.setItem("authToken", data.token); // Auth-Token speichern

    // Warenkorb synchronisieren
    const syncResponse = await fetch("http://localhost:5001/cart/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.token}`,
      },
      body: JSON.stringify({ sessionId: localStorage.getItem("sessionId") }),
    });

    if (syncResponse.ok) {
      console.log("Warenkorb erfolgreich synchronisiert.");
      localStorage.removeItem("sessionId"); // Session-ID löschen
    }

    navigate("/cart"); // Weiterleitung zur Warenkorb-Seite
  } catch (err) {
    setError(err.message);
  }
};


  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Login</h1>
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleLogin} className={styles.form}>
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          required
        />
        <button type="submit" className={styles.button}>Einloggen</button>
      </form>
      <p className={styles.linkText}>
        Noch keinen Account? <a href="/register" className={styles.link}>Registrieren</a>
      </p>
    </div>
  );
};

export default LoginPage;

