const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/authenticateToken');
const Cart = require('../models/Cart');
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name des Benutzers.
 *         email:
 *           type: string
 *           format: email
 *           description: E-Mail-Adresse des Benutzers.
 *         password_hash:
 *           type: string
 *           description: Gehashter Passwortwert.
 *         address:
 *           type: string
 *           description: Adresse des Benutzers.
 *         phone:
 *           type: string
 *           description: Telefonnummer des Benutzers.
 *         role:
 *           type: string
 *           enum:
 *             - admin
 *             - customer
 *           description: Rolle des Benutzers (admin oder customer).
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Benutzerverwaltungs-Endpunkte
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registriert einen neuen Benutzer.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Der Name des Benutzers.
 *               email:
 *                 type: string
 *                 description: Die E-Mail-Adresse des Benutzers.
 *               password:
 *                 type: string
 *                 description: Das Passwort des Benutzers (min. 6 Zeichen).
 *               address:
 *                 type: string
 *                 description: Die Adresse des Benutzers (optional).
 *               phone:
 *                 type: string
 *                 description: Die Telefonnummer des Benutzers (optional).
 *               role:
 *                 type: string
 *                 enum:
 *                   - admin
 *                   - customer
 *                 description: Die Rolle des Benutzers (optional).
 *     responses:
 *       201:
 *         description: Benutzer erfolgreich registriert.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ungültige Eingabedaten.
 *       500:
 *         description: Interner Serverfehler.
 */
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name ist erforderlich.'),
    body('email').isEmail().withMessage('Bitte eine gültige E-Mail-Adresse angeben.'),
    body('password').isLength({ min: 6 }).withMessage('Passwort muss mindestens 6 Zeichen lang sein.'),
    body('address').optional().isString().withMessage('Adresse muss ein gültiger Text sein.'),
    body('phone').optional().isMobilePhone().withMessage('Telefonnummer ist ungültig.'),
    body('role')
      .optional()
      .isIn(['admin', 'customer'])
      .withMessage('Ungültige Rolle angegeben.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log('Registrierungsdaten:', req.body);
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ message: 'E-Mail ist bereits registriert.' });
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password_hash: hashedPassword,
        address: req.body.address,
        phone: req.body.phone,
        role: req.body.role || 'customer',
      });

      const newUser = await user.save();
      res.status(201).json({ message: 'Benutzer erfolgreich registriert.', user: newUser });
    } catch (err) {
      console.error('Fehler bei der Registrierung:', err);
      next(err);
    }
  }
);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Authentifiziert einen Benutzer und gibt ein JWT-Token zurück.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Die E-Mail-Adresse des Benutzers.
 *               password:
 *                 type: string
 *                 description: Das Passwort des Benutzers.
 *     responses:
 *       200:
 *         description: Benutzer erfolgreich eingeloggt.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT-Token.
 *                 message:
 *                   type: string
 *                   description: Erfolgsmeldung.
 *       400:
 *         description: Ungültige E-Mail oder Passwort.
 *       500:
 *         description: Interner Serverfehler.
 */

// POST /login - Benutzer einloggen und Warenkorb synchronisieren
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Ungültige E-Mail-Adresse'),
    body('password').notEmpty().withMessage('Passwort ist erforderlich'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log('Login-Daten:', req.body);
      const { email, password, sessionId } = req.body;

      // Prüfe, ob der User existiert
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Ungültige E-Mail oder Passwort.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Ungültige E-Mail oder Passwort.' });
      }

      // Token erstellen
      const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      // Synchronisiere den Session-Warenkorb mit dem User-Warenkorb
      if (sessionId) {
        const sessionCart = await Cart.findOne({ sessionId });
        let userCart = await Cart.findOne({ userId: user._id });

        if (sessionCart) {
          if (userCart) {
            // Warenkörbe zusammenführen
            sessionCart.items.forEach((sessionItem) => {
              const existingItem = userCart.items.find(
                (userItem) => userItem.productId.toString() === sessionItem.productId.toString()
              );
              if (existingItem) {
                existingItem.quantity += sessionItem.quantity;
              } else {
                userCart.items.push(sessionItem);
              }
            });
          } else {
            // Session-Warenkorb direkt dem User zuweisen
            userCart = new Cart({
              userId: user._id,
              items: sessionCart.items,
            });
          }

          await userCart.save();
          await sessionCart.deleteOne(); // Lösche den Session-Warenkorb
          console.log('Warenkorb erfolgreich synchronisiert.');
        }
      }

      res.json({ token, message: 'Login erfolgreich!' });
    } catch (err) {
      console.error('Fehler beim Login:', err);
      next(err);
    }
  }
);



/**
 * @swagger
 * /users:
 *   get:
 *     summary: Ruft eine Liste aller Benutzer ab (nur für Admins).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreiche Rückgabe der Benutzerliste.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Zugriff verweigert (nicht autorisiert).
 *       500:
 *         description: Interner Serverfehler.
 */
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Zugriff verweigert. Nur Admins erlaubt.' });
  }

  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error('Fehler beim Abrufen der Benutzerliste:', err);
    res.status(500).json({ message: err.message });
  }
});



/**
 * @swagger
 * /users/protected-data:
 *   get:
 *     summary: Zugriff auf geschützte Benutzerdaten (nur mit gültigem Token).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreicher Zugriff auf geschützte Daten.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Erfolgsnachricht.
 *                 data:
 *                   type: object
 *                   description: Beispiel-Daten.
 *       401:
 *         description: Ungültiger oder fehlender Token.
 *       403:
 *         description: Zugriff verweigert (nicht autorisiert).
 *       500:
 *         description: Interner Serverfehler.
 */
router.get('/protected-data', authenticateToken, (req, res) => {
  try {
    // Beispiel-Daten, die nur für authentifizierte Benutzer sichtbar sind
    const exampleData = {
      userId: req.user.userId,
      role: req.user.role,
      message: 'Willkommen in der geschützten Zone!',
      secretInfo: 'Dies ist ein vertrauliches Beispiel für geschützte Daten.',
    };

    res.status(200).json({
      message: 'Zugriff erlaubt.',
      data: exampleData,
    });
  } catch (err) {
    console.error('Fehler beim Zugriff auf geschützte Daten:', err.message);
    res.status(500).json({ message: 'Interner Serverfehler.' });
  }
});


/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name des Benutzers.
 *         email:
 *           type: string
 *           format: email
 *           description: E-Mail-Adresse des Benutzers.
 *         password_hash:
 *           type: string
 *           description: Gehashter Passwortwert.
 *         address:
 *           type: string
 *           description: Adresse des Benutzers.
 *         phone:
 *           type: string
 *           description: Telefonnummer des Benutzers.
 *         role:
 *           type: string
 *           enum:
 *             - admin
 *             - customer
 *           description: Rolle des Benutzers (admin oder customer).
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Benutzerverwaltungs-Endpunkte
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registriert einen neuen Benutzer.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Der Name des Benutzers.
 *               email:
 *                 type: string
 *                 description: Die E-Mail-Adresse des Benutzers.
 *               password:
 *                 type: string
 *                 description: Das Passwort des Benutzers (min. 6 Zeichen).
 *               address:
 *                 type: string
 *                 description: Die Adresse des Benutzers (optional).
 *               phone:
 *                 type: string
 *                 description: Die Telefonnummer des Benutzers (optional).
 *               role:
 *                 type: string
 *                 enum:
 *                   - admin
 *                   - customer
 *                 description: Die Rolle des Benutzers (optional).
 *     responses:
 *       201:
 *         description: Benutzer erfolgreich registriert.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ungültige Eingabedaten.
 *       500:
 *         description: Interner Serverfehler.
 */
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name ist erforderlich.'),
    body('email').isEmail().withMessage('Bitte eine gültige E-Mail-Adresse angeben.'),
    body('password').isLength({ min: 6 }).withMessage('Passwort muss mindestens 6 Zeichen lang sein.'),
    body('address').optional().isString().withMessage('Adresse muss ein gültiger Text sein.'),
    body('phone').optional().isMobilePhone().withMessage('Telefonnummer ist ungültig.'),
    body('role')
      .optional()
      .isIn(['admin', 'customer'])
      .withMessage('Ungültige Rolle angegeben.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log('Registrierungsdaten:', req.body);
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ message: 'E-Mail ist bereits registriert.' });
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password_hash: hashedPassword,
        address: req.body.address,
        phone: req.body.phone,
        role: req.body.role || 'customer',
      });

      const newUser = await user.save();
      res.status(201).json({ message: 'Benutzer erfolgreich registriert.', user: newUser });
    } catch (err) {
      console.error('Fehler bei der Registrierung:', err);
      next(err);
    }
  }
);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Authentifiziert einen Benutzer und gibt ein JWT-Token zurück.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Die E-Mail-Adresse des Benutzers.
 *               password:
 *                 type: string
 *                 description: Das Passwort des Benutzers.
 *     responses:
 *       200:
 *         description: Benutzer erfolgreich eingeloggt.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT-Token.
 *                 message:
 *                   type: string
 *                   description: Erfolgsmeldung.
 *       400:
 *         description: Ungültige E-Mail oder Passwort.
 *       500:
 *         description: Interner Serverfehler.
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Ungültige E-Mail-Adresse'),
    body('password').notEmpty().withMessage('Passwort ist erforderlich'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log('Login-Daten:', req.body);
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(400).json({ message: 'Ungültige E-Mail oder Passwort.' });
      }

      const isPasswordValid = await bcrypt.compare(req.body.password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Ungültige E-Mail oder Passwort.' });
      }

      const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      res.json({ token, message: 'Login erfolgreich!' });
    } catch (err) {
      console.error('Fehler beim Login:', err);
      next(err);
    }
  }
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Ruft eine Liste aller Benutzer ab (nur für Admins).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreiche Rückgabe der Benutzerliste.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Zugriff verweigert (nicht autorisiert).
 *       500:
 *         description: Interner Serverfehler.
 */
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Zugriff verweigert. Nur Admins erlaubt.' });
  }

  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error('Fehler beim Abrufen der Benutzerliste:', err);
    res.status(500).json({ message: err.message });
  }
});



/**
 * @swagger
 * /users/protected-data:
 *   get:
 *     summary: Zugriff auf geschützte Benutzerdaten (nur mit gültigem Token).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreicher Zugriff auf geschützte Daten.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Erfolgsnachricht.
 *                 data:
 *                   type: object
 *                   description: Beispiel-Daten.
 *       401:
 *         description: Ungültiger oder fehlender Token.
 *       403:
 *         description: Zugriff verweigert (nicht autorisiert).
 *       500:
 *         description: Interner Serverfehler.
 */
router.get('/protected-data', authenticateToken, (req, res) => {
  try {
    // Beispiel-Daten, die nur für authentifizierte Benutzer sichtbar sind
    const exampleData = {
      userId: req.user.userId,
      role: req.user.role,
      message: 'Willkommen in der geschützten Zone!',
      secretInfo: 'Dies ist ein vertrauliches Beispiel für geschützte Daten.',
    };

    res.status(200).json({
      message: 'Zugriff erlaubt.',
      data: exampleData,
    });
  } catch (err) {
    console.error('Fehler beim Zugriff auf geschützte Daten:', err.message);
    res.status(500).json({ message: 'Interner Serverfehler.' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    res.json({
      name: user.name,
      email: user.email,
      address: user.address || 'Keine Adresse hinterlegt',
      city: user.city || 'Keine Stadt hinterlegt',
      zipCode: user.zipCode || 'Keine Postleitzahl hinterlegt',
      phone: user.phone || 'Keine Telefonnummer hinterlegt',
    });
  } catch (err) {
    console.error('Fehler beim Abrufen der Benutzerdaten:', err);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  const { name, email, address, city, zipCode, phone } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        name,
        email,
        address,
        city,
        zipCode,
        phone,
      },
      { new: true } // Gibt die aktualisierten Daten zurück
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    res.json({
      name: updatedUser.name,
      email: updatedUser.email,
      address: updatedUser.address || 'Keine Adresse hinterlegt',
      city: updatedUser.city || 'Keine Stadt hinterlegt',
      zipCode: updatedUser.zipCode || 'Keine Postleitzahl hinterlegt',
      phone: updatedUser.phone || 'Keine Telefonnummer hinterlegt',
    });
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Benutzerdaten:', err);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// Route für Passwort ändern
router.put('/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Altes und neues Passwort erforderlich.' });
  }

  try {
    // Benutzer aus der Datenbank abrufen
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }

    // Überprüfen, ob das alte Passwort korrekt ist
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Altes Passwort ist falsch.' });
    }

    // Neues Passwort hashen und speichern
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password_hash = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Passwort erfolgreich geändert.' });
  } catch (err) {
    console.error('Fehler beim Ändern des Passworts:', err);
    res.status(500).json({ message: 'Interner Serverfehler.' });
  }
});

module.exports = router;


