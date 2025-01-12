import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AdminCategories.module.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', image: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:5001/categories', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(response.data);
        setLoading(false);
      } catch (err) {
        setError('Fehler beim Laden der Kategorien.');
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setNewCategory((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const addCategory = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('name', newCategory.name);
      formData.append('description', newCategory.description);
      if (newCategory.image) {
        formData.append('image', newCategory.image);
      }

      const response = await axios.post('http://localhost:5001/categories', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setCategories((prev) => [...prev, response.data]);
      setNewCategory({ name: '', description: '', image: null });
      alert('Kategorie erfolgreich hinzugefügt.');
    } catch (err) {
      setError('Fehler beim Hinzufügen der Kategorie.');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Kategorien verwalten</h1>
      {loading ? (
        <p className={styles.loading}>Lädt...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <>
          <div className={styles.form}>
            <h2>Kategorie hinzufügen</h2>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={newCategory.name}
              onChange={handleInputChange}
            />
            <textarea
              name="description"
              placeholder="Beschreibung"
              value={newCategory.description}
              onChange={handleInputChange}
            ></textarea>
            <input type="file" name="image" onChange={handleFileChange} />
            <button onClick={addCategory}>Hinzufügen</button>
          </div>
          <div className={styles.categoryList}>
            {categories.map((category) => (
              <div key={category._id} className={styles.category}>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                {category.image && (
                 <img
                 src={category.image}
                 alt={category.name}
                 className={styles.categoryImage}
                />

                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCategories;

