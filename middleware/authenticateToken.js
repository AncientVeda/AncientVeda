const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Debugging: Auth Header und Token prüfen
  console.log('Authorization Header:', authHeader);
  console.log('Extracted Token:', token);

  if (!token) {
    console.error('Kein Token im Header gefunden');
    return res.status(401).json({ message: 'Kein Token bereitgestellt' }); // Fehler 401: Kein Token
  }

  // Token-Verifizierung
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token-Verifizierung fehlgeschlagen:', err.message);
      return res.status(401).json({ message: 'Ungültiger oder abgelaufener Token' }); // Fehler 401: Ungültiger Token
    }

    console.log('Token erfolgreich validiert:', user); // Debugging: Validiertes Token-Objekt
    req.user = user; // Benutzerinformationen dem Request-Objekt hinzufügen
    next(); // Weiter zur nächsten Middleware oder Route
  });
}

module.exports = authenticateToken;

