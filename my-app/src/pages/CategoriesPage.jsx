import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/CategoriesPage.module.css';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5001/categories');
        setCategories(response.data);
        setLoading(false);
      } catch (err) {
        setError('Fehler beim Laden der Kategorien.');
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <p className={styles.loading}>Lädt...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Kategorien</h1>
      <div className={styles.grid}>
        {categories.map((category, index) => (
          <div
            key={category._id}
            className={index % 3 === 0 ? styles.largeCard : styles.smallCard}
          >
            <img
            src={
            category.image.startsWith('http')
            ? category.image // Wenn die URL bereits vollständig ist, verwenden
            : `http://localhost:5001/${category.image}` // Sonst ergänzen
             }
             alt={category.name}
             className={styles.image}
             />

            <div className={styles.overlay}>
              <h2 className={styles.name}>{category.name}</h2>
              <p className={styles.description}>{category.description}</p>
              <button className={styles.button}>Entdecken</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;

