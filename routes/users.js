const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/authenticateToken');

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
 * /users/protected-route:
 *   get:
 *     summary: Testet den Zugriff auf eine geschützte Route.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Zugriff erlaubt.
 *       403:
 *         description: Ungültiger oder fehlender Token.
 */
router.get('/protected-route', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Zugriff erlaubt.' });
});

module.exports = router;

