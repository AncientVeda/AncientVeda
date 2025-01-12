import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

// Stripe Public Key
const stripePromise = loadStripe('pk_live_YOUR_STRIPE_PUBLIC_KEY');

const PaymentForm = ({ totalPrice, orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handlePayment = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!stripe || !elements) {
      setErrorMessage('Stripe ist nicht verfügbar. Bitte laden Sie die Seite neu.');
      return;
    }

    try {
      setIsProcessing(true);

      // Erstelle PaymentIntent auf dem Server
      const token = localStorage.getItem('authToken');
      const { data } = await axios.post(
        'http://localhost:5001/payments/create',
        { orderId, amount: totalPrice * 100 }, // Total in Cent
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const clientSecret = data.clientSecret;

      if (!clientSecret) {
        throw new Error('Fehler beim Abrufen des Zahlungstokens.');
      }

      // Bestätige die Zahlung
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Bestellstatus aktualisieren
        await axios.put(
          `http://localhost:5001/orders/${orderId}`,
          { status: 'success' },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Weiterleitung zur Bestellübersicht
        navigate('/orders');
      }
    } catch (error) {
      setErrorMessage('Fehler beim Zahlungsprozess. Bitte versuchen Sie es erneut.');
      console.error('Fehler beim Payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePayment} style={formStyle}>
      <h3>Gesamtbetrag: {totalPrice.toFixed(2)} €</h3>
      <CardElement style={cardStyle} />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <button type="submit" disabled={isProcessing || !stripe} style={buttonStyle}>
        {isProcessing ? 'Verarbeitung...' : 'Jetzt bezahlen'}
      </button>
    </form>
  );
};

const Payment = () => {
  const [orderId, setOrderId] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const { data } = await axios.get('http://localhost:5001/orders/last', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setOrderId(data.orderId);
        setTotalPrice(data.totalPrice);
      } catch (error) {
        console.error('Fehler beim Abrufen der Bestellung:', error);
        navigate('/delivery'); // Zurück zur Lieferadresse, falls keine Bestellung gefunden wurde
      }
    };

    fetchOrder();
  }, [navigate]);

  if (!orderId) {
    return <p>Keine Bestellung gefunden. Bitte gehen Sie zurück zur Lieferadresse.</p>;
  }

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Zahlung abschließen</h2>
      <Elements stripe={stripePromise}>
        <PaymentForm totalPrice={totalPrice} orderId={orderId} />
      </Elements>
    </div>
  );
};

// Styles
const containerStyle = {
  maxWidth: '600px',
  margin: '50px auto',
  padding: '20px',
  backgroundColor: '#222',
  color: '#fff',
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

const cardStyle = {
  base: {
    fontSize: '16px',
    color: '#fff',
    '::placeholder': {
      color: '#888',
    },
  },
};

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  fontSize: '16px',
  cursor: 'pointer',
};

export default Payment;

