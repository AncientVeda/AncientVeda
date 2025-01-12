import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/Products.module.css'; // CSS-Modul

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5001/products'); // API-Endpunkt
        setProducts(response.data);
        setFilteredProducts(response.data);
      } catch (error) {
        console.error('Fehler beim Abrufen der Produkte:', error);
      }
    };

    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  };

  return (
    <div className={styles.productsContainer}>
      <h1>Produkte</h1>
      <input
        type="text"
        placeholder="Produkt suchen..."
        value={searchTerm}
        onChange={handleSearch}
        className={styles.searchBar}
      />
      <div className={styles.productGrid}>
        {filteredProducts.map((product) => (
          <div key={product._id} className={styles.productCard}>
            {/* Zugriff auf das erste Bild im Array */}
            <img
              src={`http://localhost:5001${product.images?.[0]}`} // Nutze das erste Bild aus dem Array
              alt={product.name}
              className={styles.productImage}
            />
            <h3 className={styles.productName}>{product.name}</h3>
            <p className={styles.productPrice}>{product.price} €</p>
            <Link to={`/produkte/${product._id}`} className={styles.detailsButton}>
              Details ansehen
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;

