import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/NewProductsPage.module.css';

const NewProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5001/products/latest');
        setProducts(response.data);
      } catch (err) {
        console.error('Fehler beim Abrufen der neuesten Produkte:', err);
        setError('Es gab ein Problem beim Laden der neuesten Produkte.');
      }
    };

    fetchLatestProducts();
  }, []);

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.newProductsContainer}>
      <h1 className={styles.title}>Neu</h1>
      <div className={styles.newProductsGrid}>
        {products.map((product) => (
          <div key={product._id} className={styles.productCard}>
            <img
              src={`http://localhost:5001${product.images?.[0]}` || '/default-placeholder.png'}
              alt={product.name}
              className={styles.productImage}
            />
            <h3 className={styles.productName}>{product.name}</h3>
            <p className={styles.productPrice}>{product.price.toFixed(2)} €</p>
            <Link to={`/produkte/${product._id}`} className={styles.detailsButton}>
              Details ansehen
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewProductsPage;

