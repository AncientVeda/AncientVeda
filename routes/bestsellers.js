const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // oder was immer benötigt wird
const Product = require('../models/Product'); // Falls du Produkte abfragst

router.get('/', async (req, res) => {
  try {
    const bestsellerData = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    // Produkte mit Details abrufen
    const bestsellerProducts = await Product.find({
      _id: { $in: bestsellerData.map((item) => item._id) },
    });

    const combinedData = bestsellerData.map((item) => {
      const product = bestsellerProducts.find(
        (product) => product._id.toString() === item._id.toString()
      );
      return {
        ...product.toObject(),
        totalSold: item.totalSold,
        image: product.images?.[0] || '', // Nimm das erste Bild aus dem Array
      };
    });

    res.status(200).json(combinedData);
  } catch (err) {
    console.error('Fehler beim Abrufen der Bestseller:', err.message);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

module.exports = router; // Vergiss das Exportieren ni
