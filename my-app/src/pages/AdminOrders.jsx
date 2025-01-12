import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AdminOrders.module.css'; // CSS für AdminOrders-Seite

const AdminOrders = () => {
  const [orders, setOrders] = useState([]); // Bestellungen
  const [filteredOrders, setFilteredOrders] = useState([]); // Gefilterte Bestellungen
  const [searchQuery, setSearchQuery] = useState(''); // Suchbegriff
  const [loading, setLoading] = useState(true); // Ladeanzeige
  const [error, setError] = useState(''); // Fehlermeldungen

  // Bestellungen beim Laden der Komponente abrufen
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:5001/admin/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data);
        setFilteredOrders(response.data); // Initial alle Bestellungen anzeigen
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Abrufen der Bestellungen:', err);
        setError('Fehler beim Laden der Bestellungen.');
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Suchfunktion
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    // Filtere Bestellungen basierend auf Benutzername, E-Mail oder Bestellnummer
    const filtered = orders.filter(
      (order) =>
        order._id.toLowerCase().includes(query) ||
        order.userId?.name?.toLowerCase().includes(query) ||
        order.userId?.email?.toLowerCase().includes(query)
    );
    setFilteredOrders(filtered);
  };

  if (loading) return <p className={styles.loading}>Lädt Bestellungen...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h1>Bestellungen verwalten</h1>

      {/* Suchfeld */}
      <input
        type="text"
        placeholder="Suchen nach Benutzername, E-Mail oder Bestellnummer"
        value={searchQuery}
        onChange={handleSearch}
        className={styles.searchInput}
      />

      {filteredOrders.length === 0 ? (
        <p className={styles.noOrders}>Keine Bestellungen verfügbar.</p>
      ) : (
        <div className={styles.orderList}>
          {filteredOrders.map((order) => (
            <div key={order._id} className={styles.orderCard}>
              <h3>Bestellnummer: {order._id}</h3>
              <p>
                <strong>Benutzer:</strong> {order.userId?.name} ({order.userId?.email})
              </p>
              <p>
                <strong>Status:</strong> {order.status}
              </p>
              <p>
                <strong>Gesamtpreis:</strong> {order.total_price.toFixed(2)} €
              </p>
              <p>
                <strong>Erstellt am:</strong> {new Date(order.created_at).toLocaleString()}
              </p>
              <h4>Artikel:</h4>
              <ul>
                {order.items.map((item, index) => (
                  <li key={index} className={styles.orderItem}>
                    <p>
                      <strong>Produkt:</strong> {item.productId?.name || 'Produkt entfernt'}
                    </p>
                    <p>
                      <strong>Menge:</strong> {item.quantity}
                    </p>
                    <p>
                      <strong>Preis:</strong> {item.price.toFixed(2)} €
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;

