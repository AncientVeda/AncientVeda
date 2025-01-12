import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DeliveryAddress = () => {
  const [fullName, setFullName] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Optional: Benutzerdaten aus localStorage laden, falls sie lokal verfügbar sind
  useEffect(() => {
    const prefillData = () => {
      const storedFullName = localStorage.getItem('fullName') || '';
      const storedStreet = localStorage.getItem('street') || '';
      const storedPostalCode = localStorage.getItem('postalCode') || '';
      const storedCity = localStorage.getItem('city') || '';
      const storedCountry = localStorage.getItem('country') || '';

      setFullName(storedFullName);
      setStreet(storedStreet);
      setPostalCode(storedPostalCode);
      setCity(storedCity);
      setCountry(storedCountry);
    };

    prefillData();
  }, []);

  const handleSaveAddress = async (e) => {
    e.preventDefault();

    if (!fullName || !street || !postalCode || !city || !country) {
      setErrorMessage('Bitte füllen Sie alle Felder aus.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const { data } = await axios.post(
        'http://localhost:5001/delivery-addresses',
        { fullName, street, postalCode, city, country },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Lieferadresse gespeichert:', data);

      // Optionally: Speichere die Daten im localStorage für zukünftige Nutzung
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('street', street);
      localStorage.setItem('postalCode', postalCode);
      localStorage.setItem('city', city);
      localStorage.setItem('country', country);

      // Navigate to payment page after saving address
      navigate('/payment');
    } catch (error) {
      console.error('Fehler beim Speichern der Lieferadresse:', error.response?.data || error.message);
      setErrorMessage('Fehler beim Speichern der Lieferadresse. Bitte versuchen Sie es erneut.');
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Lieferadresse eingeben</h2>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <form onSubmit={handleSaveAddress} style={formStyle}>
        <input
          type="text"
          placeholder="Vollständiger Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Straße"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Postleitzahl"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Stadt"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Land"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>
          Weiter zur Zahlung
        </button>
      </form>
    </div>
  );
};

// Styles
const containerStyle = {
  maxWidth: '600px',
  margin: '50px auto',
  padding: '20px',
  backgroundColor: '#333',
  color: '#f0f0f0',
  borderRadius: '10px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '20px',
  fontSize: '24px',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const inputStyle = {
  padding: '10px',
  border: '1px solid #666',
  borderRadius: '5px',
  fontSize: '16px',
  backgroundColor: '#444',
  color: '#fff',
};

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#28a745',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  fontSize: '16px',
  cursor: 'pointer',
};

export default DeliveryAddress;

