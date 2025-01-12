import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // React Router für Navigation
import axios from "axios";
import styles from "../styles/Angebote.module.css";

const Angebote = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Navigation-Funktion initialisieren

  useEffect(() => {
    const fetchAngebote = async () => {
      try {
        const response = await axios.get("http://localhost:5001/products/angebote");
        setProducts(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Fehler beim Laden der Angebote:", err);
        setError("Angebote konnten nicht geladen werden.");
        setLoading(false);
      }
    };

    fetchAngebote();
  }, []);

  const handleNavigateToDetail = (productId) => {
    navigate(`/produkte/${productId}`); // Navigiere zur ProductDetail-Seite
  };

  if (loading) return <p className={styles.loading}>Lädt Angebote...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Unsere Angebote</h1>
      <div className={styles.grid}>
        {products.map((product) => (
          <div
            key={product._id}
            className={styles.card}
            onClick={() => handleNavigateToDetail(product._id)} // Navigiere bei Klick
            style={{ cursor: "pointer" }} // Zeige an, dass die Karte klickbar ist
          >
            <img
              src={`http://localhost:5001${product.images[0]}`}
              alt={product.name}
              className={styles.image}
            />
            <h2 className={styles.name}>{product.name}</h2>
            <p className={styles.price}>{product.price} €</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Angebote;

