require('dotenv').config(); // Lädt die Umgebungsvariablen
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./utils/logger');
const Sentry = require('@sentry/node');
const session = require('express-session');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');


const app = express();

// --- Sentry Setup ---
Sentry.init({
  dsn: process.env.SENTRY_DSN,
});

// --- Middleware ---
app.use(Sentry.Handlers.requestHandler()); // Sentry-Request-Handler

// CORS-Konfiguration
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', // Erlaubt nur das Frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Erlaubte Methoden
  credentials: true, // Cookies erlauben
  allowedHeaders: ['Content-Type', 'Authorization'], // Erlaubte Header
}));

// Logger
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Cookie-Parser
app.use(cookieParser());

// Session-Konfiguration mit MongoDB
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60, // 1 Tag
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Nur HTTPS in Produktion
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 Tag
  },
}));

// Statische Dateien bereitstellen
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Standard-JSON-Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Swagger Setup ---
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
  apis: ['./routes/**/*.js'], // Alle JS-Dateien in "routes" dynamisch laden
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
app.use('/bestsellers', require('./routes/bestsellers'));
app.use('/settings', require('./routes/settings'));
app.use('/delivery-addresses', require('./routes/delivery-addresses'));

// --- Fehlerbehandlung ---
// 404-Fehler
app.use((req, res, next) => {
  res.status(404).json({
    error: {
      message: `Route ${req.originalUrl} not found.`,
      status: 404,
    },
  });
});

// Sentry-Error-Handler
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

