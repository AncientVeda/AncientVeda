require('dotenv').config(); // Lädt die Umgebungsvariablen
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const Sentry = require('@sentry/node');
const session = require('express-session');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const stripeWebhookRouter = require('./routes/stripeWebhook');

// --- Sentry Setup ---
Sentry.init({
  dsn: process.env.SENTRY_DSN,
});

// --- Middleware ---
app.use(Sentry.Handlers.requestHandler()); // Sentry-Request-Handler
app.use(cors());
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));
app.use(session({
  secret: 'geheime-session-id',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' },
}));
app.use(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }), // rawBody sicherstellen
  require('./routes/stripeWebhook')
);

// Standard-JSON-Parsing für andere Routen:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        url: `http://localhost:${process.env.PORT || 5001}`,
        description: 'Lokaler Server',
      },
    ],
  },
  apis: ['./routes/**/*.js'], // Dynamisch alle JS-Dateien in "routes" laden
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- Routen ---
app.get('/', (req, res) => {
  res.send('Kräuter-Shop Backend läuft!');
});
app.use('/inventory', require('./routes/inventory'));
app.use('/cart', require('./routes/cart'));
app.use('/products', require('./routes/products'));
app.use('/users', require('./routes/users'));
app.use('/orders', require('./routes/orders'));
app.use('/payments', require('./routes/payments')); // Payments-Route
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

