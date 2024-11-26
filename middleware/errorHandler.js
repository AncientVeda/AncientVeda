// Importiere Winston für Logging
const winston = require('winston');

// Logger konfigurieren
const logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(), // Für die Konsole
        new winston.transports.File({ filename: 'logs/error.log' }) // Fehler in Datei speichern
    ]
});

// Zentrale Fehlerbehandlung
const errorHandler = (err, req, res, next) => {
    // Fehler loggen
    logger.error({
        message: err.message || 'Unbekannter Fehler',
        stack: err.stack || 'Keine Stack-Information',
        method: req.method,
        url: req.url,
        body: req.body,
        params: req.params,
        query: req.query
    });

    // Standard-Fehlerantwort
    res.status(err.status || 500).json({
        message: err.message || 'Interner Serverfehler',
    });
};

module.exports = errorHandler;

