import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AdminDiscounts.module.css';

const AdminDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    discountType: 'fixed', // Standardwert
    value: '',
    expirationDate: '',
    usageLimit: '',
  });

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:5001/admin/discounts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDiscounts(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Fehler beim Laden der Rabatte.');
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDiscount((prev) => ({ ...prev, [name]: value }));
  };

  const addDiscount = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        'http://localhost:5001/admin/discounts',
        {
          ...newDiscount,
          value: parseFloat(newDiscount.value),
          usageLimit: newDiscount.usageLimit ? parseInt(newDiscount.usageLimit, 10) : null,
        },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }
      );
      alert('Rabatt erfolgreich hinzugefügt.');
      setNewDiscount({
        code: '',
        discountType: 'fixed',
        value: '',
        expirationDate: '',
        usageLimit: '',
      });
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Fehler beim Hinzufügen des Rabatts.');
    }
  };

  if (loading) return <p>Lädt Rabatte...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.container}>
      <h1>Rabatte verwalten</h1>
      <div className={styles.form}>
        <h2>Neuen Rabatt hinzufügen</h2>
        <input
          type="text"
          name="code"
          placeholder="Code"
          value={newDiscount.code}
          onChange={handleInputChange}
        />
        <select name="discountType" value={newDiscount.discountType} onChange={handleInputChange}>
          <option value="fixed">Fester Betrag</option>
          <option value="percentage">Prozentsatz</option>
        </select>
        <input
          type="number"
          name="value"
          placeholder="Wert"
          value={newDiscount.value}
          onChange={handleInputChange}
        />
        <input
          type="date"
          name="expirationDate"
          placeholder="Ablaufdatum"
          value={newDiscount.expirationDate}
          onChange={handleInputChange}
        />
        <input
          type="number"
          name="usageLimit"
          placeholder="Verwendungslimit (leer für unbegrenzt)"
          value={newDiscount.usageLimit}
          onChange={handleInputChange}
        />
        <button onClick={addDiscount}>Hinzufügen</button>
      </div>

      <h2>Bestehende Rabatte</h2>
      <table className={styles.discountTable}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Typ</th>
            <th>Wert</th>
            <th>Ablaufdatum</th>
            <th>Verwendungslimit</th>
            <th>Bisher verwendet</th>
          </tr>
        </thead>
        <tbody>
          {discounts.map((discount) => (
            <tr key={discount._id}>
              <td>{discount.code}</td>
              <td>{discount.discountType === 'fixed' ? 'Fester Betrag' : 'Prozentsatz'}</td>
              <td>
                {discount.discountType === 'fixed'
                  ? `${discount.value.toFixed(2)} €`
                  : `${discount.value.toFixed(2)} %`}
              </td>
              <td>{new Date(discount.expirationDate).toLocaleDateString()}</td>
              <td>{discount.usageLimit || 'Unbegrenzt'}</td>
              <td>{discount.usedCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDiscounts;

