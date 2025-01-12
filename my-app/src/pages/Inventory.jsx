import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Inventory.module.css';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedStocks, setUpdatedStocks] = useState({}); // Für geänderte Bestände

  // Produkte beim Laden der Komponente abrufen
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:5001/admin/products', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Abrufen der Produkte:', err);
        setError('Fehler beim Laden der Produkte.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Lagerbestand aktualisieren
  const updateStocks = async () => {
    try {
      const token = localStorage.getItem('authToken');

      // Alle Änderungen iterieren und API-Aufrufe senden
      for (const productId in updatedStocks) {
        await axios.put(
          `http://localhost:5001/admin/products/${productId}`,
          { stock: updatedStocks[productId] },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Änderungen übernehmen
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          updatedStocks[product._id]
            ? { ...product, stock: updatedStocks[product._id] }
            : product
        )
      );
      setUpdatedStocks({});
      alert('Bestand erfolgreich aktualisiert.');
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Bestands:', err);
      alert('Fehler beim Aktualisieren des Bestands.');
    }
  };

  const handleStockChange = (e, productId) => {
    const newStock = parseInt(e.target.value, 10);
    if (isNaN(newStock) || newStock < 0) return;
    setUpdatedStocks((prev) => ({ ...prev, [productId]: newStock }));
  };

  if (loading) return <p className={styles.loading}>Lädt Produkte...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h1>Inventar verwalten</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Bild</th>
            <th>Produktname</th>
            <th>Aktueller Bestand</th>
            <th>Bestand bearbeiten</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>
                <img
                  src={`http://localhost:5001${product.images?.[0]}`}
                  alt={product.name}
                  className={styles.productImage}
                />
              </td>
              <td>{product.name}</td>
              <td>{product.stock}</td>
              <td>
                <input
                  type="number"
                  defaultValue={product.stock}
                  min="0"
                  onChange={(e) => handleStockChange(e, product._id)}
                  className={styles.stockInput}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.buttonContainer}>
        <button onClick={updateStocks} className={styles.updateButton}>
          Änderungen bestätigen
        </button>
      </div>
    </div>
  );
};

export default Inventory;

