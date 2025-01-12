import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/MyProfile.module.css';

const MyProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState('');
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
    city: '',
    zipCode: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/users/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        setProfileData(response.data);
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          birthDate: response.data.birthDate || '',
          address: response.data.address || '',
          city: response.data.city || '',
          zipCode: response.data.zipCode || '',
        });
      } catch (err) {
        setError('Fehler beim Abrufen der Profildaten.');
      }
    };

    fetchProfileData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSavePersonalData = async () => {
    try {
      const response = await axios.put(
        'http://localhost:5001/users/profile',
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      setProfileData(response.data);
      setEditingPersonal(false);
      alert('Persönliche Daten erfolgreich gespeichert!');
    } catch (err) {
      setError('Fehler beim Speichern der persönlichen Daten.');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Die neuen Passwörter stimmen nicht überein.');
      return;
    }
    try {
      await axios.put(
        'http://localhost:5001/users/change-password',
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      alert('Passwort erfolgreich geändert!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      alert('Fehler beim Ändern des Passworts.');
    }
  };

  const fetchOrderHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5001/orders/history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setOrders(response.data);
      setShowOrders(true);
    } catch (err) {
      alert('Fehler beim Abrufen der Bestellübersicht.');
    }
  };

  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.profileContainer}>
      <h1>Mein Profil</h1>
      {profileData && (
        <div>
          {/* Persönliche Daten */}
          <section className={styles.profileSection}>
            <h2>Persönliche Daten</h2>
            {editingPersonal ? (
              <div className={styles.editForm}>
                <label>
                  Name:
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  E-Mail-Adresse:
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Telefonnummer:
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Geburtsdatum:
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                  />
                </label>
                <button onClick={handleSavePersonalData} className={styles.saveButton}>
                  Speichern
                </button>
                <button onClick={() => setEditingPersonal(false)} className={styles.cancelButton}>
                  Abbrechen
                </button>
              </div>
            ) : (
              <div className={styles.profileInfo}>
                <p><strong>Name:</strong> {profileData.name || 'Nicht angegeben'}</p>
                <p><strong>E-Mail:</strong> {profileData.email || 'Nicht angegeben'}</p>
                <p><strong>Telefonnummer:</strong> {profileData.phone || 'Nicht angegeben'}</p>
                <p><strong>Geburtsdatum:</strong> {profileData.birthDate || 'Nicht angegeben'}</p>
                <button onClick={() => setEditingPersonal(true)} className={styles.editButton}>
                  Bearbeiten
                </button>
              </div>
            )}
          </section>

          {/* Adressen */}
          <section className={styles.profileSection}>
            <h2>Adressen</h2>
            {editingAddress ? (
              <div className={styles.editForm}>
                <label>
                  Adresse:
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Stadt:
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Postleitzahl:
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                  />
                </label>
                <button onClick={handleSavePersonalData} className={styles.saveButton}>
                  Speichern
                </button>
                <button onClick={() => setEditingAddress(false)} className={styles.cancelButton}>
                  Abbrechen
                </button>
              </div>
            ) : (
              <div className={styles.profileInfo}>
                <p><strong>Adresse:</strong> {profileData.address || 'Keine Adresse hinterlegt'}</p>
                <p><strong>Stadt:</strong> {profileData.city || 'Keine Stadt angegeben'}</p>
                <p><strong>Postleitzahl:</strong> {profileData.zipCode || 'Keine Postleitzahl angegeben'}</p>
                <button onClick={() => setEditingAddress(true)} className={styles.editButton}>
                  Bearbeiten
                </button>
              </div>
            )}
          </section>

          {/* Passwort ändern */}
          <section className={styles.profileSection}>
            <h2>Passwort ändern</h2>
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className={styles.editButton}
              >
                Passwort ändern
              </button>
            ) : (
              <div className={styles.editForm}>
                <label>
                  Altes Passwort:
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, oldPassword: e.target.value })
                    }
                  />
                </label>
                <label>
                  Neues Passwort:
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                  />
                </label>
                <label>
                  Passwort bestätigen:
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                  />
                </label>
                <button onClick={handlePasswordChange} className={styles.saveButton}>
                  Speichern
                </button>
                <button
                  onClick={() => setShowPasswordForm(false)}
                  className={styles.cancelButton}
                >
                  Abbrechen
                </button>
              </div>
            )}
          </section>

          {/* Bestellübersicht */}
          <section className={styles.profileSection}>
            <h2>Bestellübersicht</h2>
            <button onClick={fetchOrderHistory} className={styles.editButton}>
              Bestellungen anzeigen
            </button>

            {showOrders && (
              <div className={styles.orderTableContainer}>
                <h3>Ihre Bestellungen</h3>
                {orders.length > 0 ? (
                  <table className={styles.orderTable}>
                    <thead>
                      <tr>
                        <th>Bestellnummer</th>
                        <th>Datum</th>
                        <th>Status</th>
                        <th>Produkte</th>
                        <th>Gesamtpreis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td>{order._id}</td>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td>{order.status}</td>
                          <td>
                            <ul>
                              {order.items.map((item, index) => (
                                <li key={index}>
                                  {item.name} - {item.quantity} x {item.price.toFixed(2)}€
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td>
                            {order.items.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)}€
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>Keine Bestellungen gefunden.</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default MyProfile;

