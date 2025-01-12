import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AdminDashboard.module.css';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:5001/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Laden des Dashboards:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Fehler beim Laden des Dashboards.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <p className={styles.loading}>Lädt Dashboard...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h1>Admin Dashboard</h1>
      {dashboardData.length === 0 ? (
        <p className={styles.noData}>Keine Daten verfügbar.</p>
      ) : (
        <div className={styles.dashboardGrid}>
          {dashboardData.map((data, index) => (
            <div key={index} className={styles.card}>
              <h3>Zahlung: {data.payment.transactionId}</h3>
              <p><strong>Status:</strong> {data.payment.status}</p>
              <p><strong>Betrag:</strong> {data.payment.amount.toFixed(2)} {data.payment.currency}</p>
              <p><strong>Bestellnummer:</strong> {data.order?._id || 'Keine zugehörige Bestellung'}</p>
              <p><strong>Benutzer:</strong> {data.user?.name || 'Unbekannt'} ({data.user?.email || '-'})</p>
              <p><strong>Lieferadresse:</strong> {data.deliveryAddress
                ? `${data.deliveryAddress.street}, ${data.deliveryAddress.postalCode} ${data.deliveryAddress.city}, ${data.deliveryAddress.country}`
                : 'Keine zugehörige Lieferadresse'}</p>
              <p><strong>Artikel:</strong></p>
              <ul>
                {data.order?.items.map((item, idx) => (
                  <li key={idx}>
                    {item.productId?.name} - {item.quantity} x {item.price.toFixed(2)} €
                  </li>
                )) || 'Keine Artikel'}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

