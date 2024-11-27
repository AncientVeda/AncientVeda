const mongoose = require('mongoose');
const app = require('./app'); // Importiere die App

// MongoDB-Verbindung herstellen
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Mit MongoDB verbunden!'))
  .catch((error) => console.error('Fehler bei der Verbindung mit MongoDB:', error));

// Server starten
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

