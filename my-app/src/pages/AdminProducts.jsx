import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AdminProducts.module.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    image: null,
  });
  const [showAddForm, setShowAddForm] = useState(false); // Steuert die Anzeige des Formulars
  const [searchTerm, setSearchTerm] = useState(''); // Suchbegriff

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get('http://localhost:5001/admin/products', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5001/admin/categories', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setProducts(productsResponse.data);
        setCategories(categoriesResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Fehler beim Laden der Daten.');
        setLoading(false);
      }
    };

    fetchProductsAndCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setNewProduct((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const addProduct = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      Object.entries(newProduct).forEach(([key, value]) => {
        formData.append(key, value);
      });

      await axios.post('http://localhost:5001/admin/products', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      window.location.reload();
    } catch (err) {
      setError('Fehler beim Hinzufügen des Produkts.');
    }
  };

  const updateProduct = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      Object.entries(editProduct).forEach(([key, value]) => {
        formData.append(key, value);
      });

      await axios.put(
        `http://localhost:5001/admin/products/${editProduct._id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      window.location.reload();
    } catch (err) {
      setError('Fehler beim Aktualisieren des Produkts.');
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`http://localhost:5001/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((product) => product._id !== productId));
    } catch (err) {
      setError('Fehler beim Löschen des Produkts.');
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Produkte verwalten</h1>
      {loading ? (
        <p className={styles.loading}>Lädt...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <>
          {/* Suchleiste */}
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Produkt suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Button zum Anzeigen des Formulars */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={styles.toggleFormButton}
          >
            {showAddForm ? 'Formular schließen' : 'Produkt hinzufügen'}
          </button>

          {/* Formular nur anzeigen, wenn Button geklickt */}
          {showAddForm && (
            <div className={styles.form}>
              <h2>Produkt hinzufügen</h2>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={newProduct.name}
                onChange={handleInputChange}
              />
              <input
                type="number"
                name="price"
                placeholder="Preis"
                value={newProduct.price}
                onChange={handleInputChange}
              />
              <select
                name="category"
                value={newProduct.category}
                onChange={handleInputChange}
              >
                <option value="">Kategorie auswählen</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="stock"
                placeholder="Lagerbestand"
                value={newProduct.stock}
                onChange={handleInputChange}
              />
              <input type="file" name="image" onChange={handleFileChange} />
              <button onClick={addProduct}>Hinzufügen</button>
            </div>
          )}

          {/* Tabelle der Produkte */}
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bild</th>
                <th>Name</th>
                <th>Preis</th>
                <th>Kategorie</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>
                    <img
                      src={`http://localhost:5001${product.images?.[0]}`}
                      alt={product.name}
                      className={styles.productImage}
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.price} €</td>
                  <td>
                    {categories.find((cat) => cat._id === product.category)
                      ?.name || 'Keine Kategorie'}
                  </td>
                  <td>
                    <button
                      className={styles.editButton}
                      onClick={() => setEditProduct(product)}
                    >
                      Bearbeiten
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => deleteProduct(product._id)}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default AdminProducts;

