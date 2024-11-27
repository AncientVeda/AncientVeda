const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error('Kein Token im Header gefunden');
    return res.status(401).json({ message: 'Kein Token bereitgestellt' });
  }

console.log('Authorization Header:', req.headers['authorization']);
console.log('Token Secret:', process.env.JWT_SECRET);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => { // `JWT_SECRET` statt `ACCESS_TOKEN_SECRET`
    if (err) {
      console.error('Token-Verifizierung fehlgeschlagen:', err.message);
      return res.status(401).json({ message: 'Ungültiger oder abgelaufener Token' });
    }

    console.log('Token validiert:', user); // Debugging
    req.user = user;
    next();
  });
}



module.exports = authenticateToken;

