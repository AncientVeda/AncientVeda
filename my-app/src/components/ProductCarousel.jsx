import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/ProductCarousel.module.css"; // CSS-Modul

const ProductCarousel = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5001/orders/top-products"); // Neuer Endpoint
        setProducts(response.data);
      } catch (err) {
        console.error("Fehler beim Abrufen der Top-Produkte:", err);
        setError("Top-Produkte konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  const handleProductClick = (productId) => {
    navigate(`/produkte/${productId}`);
  };

  if (loading) return <p className={styles.loading}>Produkte werden geladen...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.carouselContainer}>
      {products.map((product) => (
        <div
          key={product._id}
          className={styles.productCard}
          onClick={() => handleProductClick(product._id)}
        >
          <div className={styles.imageContainer}>
            <img
              src={
                product.images?.[0]
                  ? `http://localhost:5001${product.images[0]}`
                  : "https://via.placeholder.com/200"
              }
              alt={product.name}
              className={styles.productImage}
            />
          </div>
          <div className={styles.productDetails}>
            <h3 className={styles.productName}>{product.name}</h3>
            <p className={styles.productPrice}>{product.price} €</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductCarousel;

