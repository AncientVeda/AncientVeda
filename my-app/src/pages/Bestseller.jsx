import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/Bestseller.module.css';

const Bestseller = () => {
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        const response = await axios.get('http://localhost:5001/bestsellers');
        setBestsellers(response.data);
      } catch (err) {
        console.error('Fehler beim Abrufen der Bestseller:', err);
        setError('Bestseller konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    fetchBestsellers();
  }, []);

  const handleNavigateToProductDetail = (productId) => {
    navigate(`/produkte/${productId}`);
  };

  if (loading) return <p className={styles.loading}>Lädt Bestseller...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Bestseller</h1>
      <div className={styles.grid}>
        {bestsellers.map((product) => (
          <div
            key={product._id}
            className={styles.card}
            onClick={() => handleNavigateToProductDetail(product._id)}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={`http://localhost:5001${product.image}`}
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

export default Bestseller;

