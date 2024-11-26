require('dotenv').config(); // Lädt die Umgebungsvariablen
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const Sentry = require('@sentry/node');
const session = require('express-session');


// Swagger
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

console.log('Server lädt...');

// Sentry initialisieren (ohne Http-Integration)
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Express({ app: express() }), // Nur Express-Integration
  ],
  tracesSampleRate: 1.0,
});

const app = express();

console.log('Middleware wird geladen...');

// Middleware
app.use(Sentry.Handlers.requestHandler());
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
// MongoDB-Verbindung herstellen
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Mit MongoDB verbunden!'))
  .catch((error) => console.error('Fehler bei der Verbindung mit MongoDB:', error));

// Swagger-Definitionen
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
    tags: [
      { name: 'Products', description: 'Produktbezogene Endpunkte' },
      { name: 'Cart', description: 'Warenkorbbezogene Endpunkte' },
    ],
  },
  apis: ['./routes/*.js'], // Pfad zu deinen Routen-Dateien
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

console.log('Routen importieren...');

// Routen importieren
const cartRoutes = require('./routes/cart');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const inventoryRoutes = require('./routes/inventory');
const categoryRoutes = require('./routes/categories');
const marketingRoutes = require('./routes/marketing');
const adminRoutes = require('./routes/admin');

// Routen definieren
app.get('/', (req, res) => {
  res.send('Kräuter-Shop Backend läuft!');
});
app.use('/cart', cartRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/orders', orderRoutes);
app.use('/payments', paymentRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/categories', categoryRoutes);
app.use('/marketing', marketingRoutes);
app.use('/admin', adminRoutes);

// 404-Middleware (für nicht gefundene Routen)
app.use((req, res, next) => {
  res.status(404).json({
    error: {
      message: `Route ${req.originalUrl} not found.`,
      status: 404,
    },
  });
});

// Sentry-Fehler-Handler
app.use(Sentry.Handlers.errorHandler());

// Fehlerbehandlungs-Middleware
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

console.log('Server starten...');

// Server starten

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

module.exports = { app, server };

