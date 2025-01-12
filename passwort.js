require('dotenv').config(); // Lädt die Umgebungsvariablen aus der .env-Datei
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // Passe den Pfad zu deinem User-Modell an

(async () => {
  try {
    // Verbindung zur Datenbank herstellen
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Mit der Datenbank verbunden.');

    // Neues Passwort festlegen und verschlüsseln
    const newPassword = 'neuesPasswort123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Admin-Benutzer aktualisieren
    const result = await User.updateOne(
      { email: 'admin@example.com' }, // Finde den Admin-User
      { $set: { password_hash: hashedPassword } } // Neues Passwort setzen
    );

    if (result.nModified === 0) {
      console.log('Admin-Benutzer nicht gefunden oder Passwort nicht aktualisiert.');
    } else {
      console.log('Passwort wurde erfolgreich zurückgesetzt.');
    }

    // Verbindung zur Datenbank schließen
    await mongoose.connection.close();
    console.log('Datenbankverbindung geschlossen.');
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Passworts:', error);
  }
})();

