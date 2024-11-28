require('dotenv').config(); // Lädt die Umgebungsvariablen
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const Sentry = require('@sentry/node');
const session = require('express-session');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();

// Importiere Routen
const paymentsRoute = require('./routes/payments');
const stripeWebhookRoutes = require('./routes/stripeWebhook');

// --- Middleware ---
app.use(Sentry.Handlers.requestHandler()); // Sentry-Request-Handler
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));
app.use(session({
  secret: 'geheime-session-id',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// --- Swagger ---
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Ancient-Veda API',
      version: '1.0.0',
      description: 'API-Dokumentation für den Kräuter-Shop',
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Lokaler Server',
      },
    ],
  },
  apis: ['./routes/*.js'], // Pfad zu deinen Routen-Dateien
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- Routen ---
app.get('/', (req, res) => {
  res.send('Kräuter-Shop Backend läuft!');
});

app.use('/cart', require('./routes/cart'));
app.use('/products', require('./routes/products'));
app.use('/users', require('./routes/users'));
app.use('/orders', require('./routes/orders'));
app.use('/payments', paymentsRoute); // Registriert Payments-Route
app.use('/webhook', stripeWebhookRoutes); // Registriert Stripe Webhook
app.use('/inventory', require('./routes/inventory'));
app.use('/categories', require('./routes/categories'));
app.use('/marketing', require('./routes/marketing'));
app.use('/admin', require('./routes/admin'));

// --- Fehlerbehandlung ---
app.use((req, res, next) => {
  res.status(404).json({
    error: {
      message: `Route ${req.originalUrl} not found.`,
      status: 404,
    },
  });
});

// Sentry-Error-Handler muss am Ende stehen
app.use(Sentry.Handlers.errorHandler());

// Generische Fehlerbehandlung
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Interner Serverfehler',
    },
  });
});

module.exports = app;

