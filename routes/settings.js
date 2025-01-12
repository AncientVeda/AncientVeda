const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

// Beispiel-Datenstruktur für gespeicherte Einstellungen
const settings = {
  notifications: {
    email: true,
    push: false,
  },
  language: 'de',
  currency: 'EUR',
  privacy: {
    cookieConsent: true,
    dataDeletionRequest: false,
  },
  paymentMethods: [
    { type: 'PayPal', primary: true },
    { type: 'Credit Card', primary: false },
  ],
  theme: 'light', // light oder dark
};

// GET: Hole die aktuellen Einstellungen
router.get('/', authenticateToken, (req, res) => {
  try {
    res.json({ settings });
  } catch (err) {
    console.error('Fehler beim Abrufen der Einstellungen:', err);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// PUT: Aktualisiere bestimmte Einstellungen
router.put('/', authenticateToken, (req, res) => {
  try {
    const { notifications, language, currency, privacy, paymentMethods, theme } = req.body;

    if (notifications) settings.notifications = notifications;
    if (language) settings.language = language;
    if (currency) settings.currency = currency;
    if (privacy) settings.privacy = privacy;
    if (paymentMethods) settings.paymentMethods = paymentMethods;
    if (theme) settings.theme = theme;

    res.json({ message: 'Einstellungen erfolgreich aktualisiert', settings });
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Einstellungen:', err);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

module.exports = router;

