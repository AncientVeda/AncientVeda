import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/ProductDetail.module.css"; // Styles aus CSS-Modul importieren

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  // Produktdetails abrufen
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/products/${productId}`);
        setProduct(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Fehler beim Laden des Produkts:", err);
        setError("Produkt konnte nicht geladen werden.");
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Produkt zum Warenkorb hinzufügen
  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem("authToken");
      let sessionId = localStorage.getItem("sessionId");

      // Session-ID erstellen, falls nicht vorhanden
      if (!sessionId) {
        sessionId = `session_${Date.now()}`;
        localStorage.setItem("sessionId", sessionId);
      }

      const cartData = {
        productId: product._id,
        quantity,
        sessionId,
      };

      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {}; // Nur Header hinzufügen, wenn der User eingeloggt ist

      await axios.post("http://localhost:5001/cart", cartData, config);
      alert("Produkt wurde erfolgreich zum Warenkorb hinzugefügt!");
    } catch (err) {
      console.error("Fehler beim Hinzufügen zum Warenkorb:", err);
      setError("Produkt konnte nicht hinzugefügt werden. Bitte versuche es erneut.");
    }
  };

  if (loading) {
    return <p className={styles.loading}>Produktdetails werden geladen...</p>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.container}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        Zurück
      </button>

      <div className={styles.productContainer}>
        <img
          src={`http://localhost:5001${product.images?.[0]}`} // Zeigt das erste Bild an
          alt={product.name}
          className={styles.image}
        />

        <div className={styles.details}>
          <h1 className={styles.name}>{product.name}</h1>
          <p className={styles.price}>{product.price} €</p>
          <p className={styles.description}>
            {product.description || "Keine Beschreibung verfügbar."}
          </p>

          {/* Menge auswählen */}
          <div className={styles.quantityContainer}>
            <button
              onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}
              className={styles.quantityButton}
            >
              -
            </button>
            <span>{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className={styles.quantityButton}
            >
              +
            </button>
          </div>

          {/* Zum Warenkorb hinzufügen */}
          <button onClick={handleAddToCart} className={styles.addToCartButton}>
            Zum Warenkorb hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

