const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Cart = require("../models/Cart");
const Product = require("../models/Product"); // <-- Produkt-Modell importieren


// POST: Produkt zum Warenkorb hinzufügen oder aktualisieren
// POST: Produkt zum Warenkorb hinzufügen oder aktualisieren
router.post("/", async (req, res) => {
  const { productId, quantity, sessionId } = req.body;
  const token = req.headers.authorization
    ? req.headers.authorization.split(" ")[1]
    : null;

  if (!productId || quantity < 1) {
    return res.status(400).json({ message: "Produkt-ID und gültige Menge erforderlich." });
  }

  try {
    // Validierung: Prüfe, ob das Produkt existiert
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Produkt nicht gefunden." });
    }

    let userId = null;
    if (token) {
      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        userId = decodedToken.userId;
      } catch (err) {
        return res.status(401).json({ message: "Ungültiges Token." });
      }
    }

    // Warenkorb abrufen oder erstellen
    const cart = await getOrCreateCart({ userId, sessionId });

    // Produkt im Warenkorb aktualisieren oder hinzufügen
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity = Math.max(1, quantity); // Menge aktualisieren, mindestens 1
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();

    // Warenkorb aktualisiert - Rückgabe
    const updatedCart = await cart.populate("items.productId", "name price images");
    res.status(200).json({ message: "Warenkorb aktualisiert.", cart: updatedCart });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Warenkorbs:", error);
    res.status(500).json({ message: "Interner Serverfehler." });
  }
});

// Helper-Funktion: Warenkorb abrufen oder erstellen
async function getOrCreateCart({ userId, sessionId }) {
  if (userId) {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }
    return cart;
  }

  if (sessionId) {
    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }
    return cart;
  }

  throw new Error("Weder Benutzer-ID noch Session-ID vorhanden.");
}




// GET: Warenkorb abrufen
// GET: Warenkorb abrufen
router.get("/", async (req, res) => {
  const token = req.headers.authorization
    ? req.headers.authorization.split(" ")[1]
    : null;
  const sessionId = req.query.sessionId;

  try {
    let cart;

    if (token) {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken.userId;

      // Populate mit allen notwendigen Feldern
      cart = await Cart.findOne({ userId }).populate(
        "items.productId",
        "name price images" // Felder, die geladen werden sollen
      );
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId }).populate(
        "items.productId",
        "name price images"
      );
    }

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({ items: [], totalPrice: 0 });
    }

    const totalPrice = cart.items.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    res.status(200).json({
      items: cart.items.map((item) => ({
        productId: item.productId._id,
        name: item.productId.name,
        price: item.productId.price,
        quantity: item.quantity,
        total: item.productId.price * item.quantity,
        image: item.productId.images?.[0] || null, // Erstes Bild verwenden
      })),
      totalPrice,
    });
  } catch (error) {
    console.error("Fehler beim Abrufen des Warenkorbs:", error);
    return res.status(500).json({ message: "Interner Serverfehler." });
  }
});

// DELETE: Produkt aus dem Warenkorb entfernen
router.delete("/:productId", async (req, res) => {
  const { productId } = req.params;
  const token = req.headers.authorization
    ? req.headers.authorization.split(" ")[1]
    : null;
  const sessionId = req.query.sessionId;

  try {
    let userId = null;

    if (token) {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      userId = decodedToken.userId;
    }

    const cart = await getOrCreateCart({ userId, sessionId });

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);

    await cart.save();
    res.status(200).json({ message: "Produkt aus dem Warenkorb entfernt.", cart });
  } catch (error) {
    console.error("Fehler beim Entfernen des Produkts:", error);
    res.status(500).json({ message: "Interner Serverfehler." });
  }
});

// POST: Synchronisation von Session-Cart zu User-Cart
router.post("/sync", async (req, res) => {
  const { sessionId } = req.body;
  const token = req.headers.authorization
    ? req.headers.authorization.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: "Nicht autorisiert." });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    const sessionCart = await Cart.findOne({ sessionId });
    let userCart = await Cart.findOne({ userId });

    if (sessionCart) {
      if (!userCart) {
        userCart = new Cart({ userId, items: sessionCart.items });
      } else {
        sessionCart.items.forEach((sessionItem) => {
          const existingItem = userCart.items.find(
            (item) => item.productId.toString() === sessionItem.productId.toString()
          );

          if (existingItem) {
            existingItem.quantity += sessionItem.quantity;
          } else {
            userCart.items.push(sessionItem);
          }
        });
      }

      await userCart.save();
      await Cart.deleteOne({ sessionId });
    }

    res.status(200).json({ message: "Warenkorb synchronisiert.", cart: userCart });
  } catch (error) {
    console.error("Fehler beim Synchronisieren des Warenkorbs:", error);
    res.status(500).json({ message: "Interner Serverfehler." });
  }
});

module.exports = router;

