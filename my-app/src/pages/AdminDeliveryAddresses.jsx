import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AdminDeliveryAddresses.module.css';

const AdminDeliveryAddresses = () => {
  const [addresses, setAddresses] = useState([]); // Lieferadressen
  const [loading, setLoading] = useState(true); // Ladeanzeige
  const [error, setError] = useState(''); // Fehlermeldungen
  const [searchTerm, setSearchTerm] = useState(''); // Suchbegriff

  // Lieferadressen beim Laden der Komponente abrufen
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:5001/admin/delivery-addresses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAddresses(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Abrufen der Lieferadressen:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Fehler beim Laden der Lieferadressen.');
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  // Filter für Suchbegriffe
  const filteredAddresses = addresses.filter((address) =>
    address.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    address.paymentId?.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    address.orderId?._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className={styles.loading}>Lädt Lieferadressen...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h1>Lieferadressen verwalten</h1>
      <input
        type="text"
        placeholder="Suchen nach Name, Transaktionsnummer oder Bestellnummer..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchInput}
      />
      {filteredAddresses.length === 0 ? (
        <p className={styles.noAddresses}>Keine Lieferadressen gefunden.</p>
      ) : (
        <table className={styles.addressTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Adresse</th>
              <th>Stadt</th>
              <th>PLZ</th>
              <th>Land</th>
              <th>Transaktionsnummer</th>
              <th>Bestellnummer</th>
            </tr>
          </thead>
          <tbody>
            {filteredAddresses.map((address) => (
              <tr key={address._id}>
                <td>{address.userId?.name || '-'}</td>
                <td>{address.userId?.email || '-'}</td>
                <td>{address.street || '-'}</td>
                <td>{address.city || '-'}</td>
                <td>{address.postalCode || '-'}</td>
                <td>{address.country || '-'}</td>
                <td>{address.paymentId?.transactionId || '-'}</td>
                <td>{address.orderId?._id || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDeliveryAddresses;

