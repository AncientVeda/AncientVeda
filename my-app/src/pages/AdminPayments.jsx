import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AdminPayments.module.css'; // CSS für AdminPayments-Seite

const AdminPayments = () => {
  const [payments, setPayments] = useState([]); // Zahlungen
  const [filteredPayments, setFilteredPayments] = useState([]); // Gefilterte Zahlungen
  const [searchQuery, setSearchQuery] = useState(''); // Suchbegriff
  const [loading, setLoading] = useState(true); // Ladeanzeige
  const [error, setError] = useState(''); // Fehlermeldungen

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:5001/admin/payments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPayments(response.data);
        setFilteredPayments(response.data); // Initial alle Zahlungen anzeigen
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Abrufen der Zahlungen:', err);
        setError('Fehler beim Laden der Zahlungen.');
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    // Filtere Zahlungen basierend auf Benutzername, E-Mail oder Transaktions-ID
    const filtered = payments.filter(
      (payment) =>
        payment.transactionId.toLowerCase().includes(query) ||
        payment.userId?.name?.toLowerCase().includes(query) ||
        payment.userId?.email?.toLowerCase().includes(query)
    );
    setFilteredPayments(filtered);
  };

  if (loading) return <p className={styles.loading}>Lädt Zahlungen...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h1>Zahlungen verwalten</h1>

      {/* Suchfeld */}
      <input
        type="text"
        placeholder="Suchen nach Benutzername, E-Mail oder Transaktions-ID"
        value={searchQuery}
        onChange={handleSearch}
        className={styles.searchInput}
      />

      {filteredPayments.length === 0 ? (
        <p className={styles.noPayments}>Keine Zahlungen verfügbar.</p>
      ) : (
        <div className={styles.paymentList}>
          {filteredPayments.map((payment) => (
            <div key={payment._id} className={styles.paymentCard}>
              <h3>Transaktions-ID: {payment.transactionId}</h3>
              <p>
                <strong>Benutzer:</strong> {payment.userId?.name} ({payment.userId?.email})
              </p>
              <p>
                <strong>Betrag:</strong> {payment.amount.toFixed(2)} {payment.currency}
              </p>
              <p>
                <strong>Status:</strong> {payment.status}
              </p>
              <p>
                <strong>Erstellt am:</strong> {new Date(payment.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPayments;

