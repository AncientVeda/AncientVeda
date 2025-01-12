import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const sessionId = localStorage.getItem("sessionId");

      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : undefined;

      const response = await axios.get("http://localhost:5001/cart", {
        headers,
        params: !token && sessionId ? { sessionId } : undefined,
      });

      setCartItems(response.data.items);
      setTotalPrice(response.data.totalPrice || 0);
    } catch (err) {
      console.error("Fehler beim Laden des Warenkorbs:", err);
      setError("Warenkorb konnte nicht geladen werden.");
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      const token = localStorage.getItem("authToken");
      const sessionId = localStorage.getItem("sessionId");

      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : undefined;

      const url = `http://localhost:5001/cart/${productId}`;
      const config = token ? { headers } : { params: { sessionId } };

      await axios.delete(url, config);
      fetchCart();
    } catch (err) {
      console.error("Fehler beim Entfernen des Produkts:", err);
      alert("Fehler beim Entfernen des Produkts. Bitte versuchen Sie es erneut.");
    }
  };

const handleUpdateQuantity = async (productId, newQuantity) => {
  try {
    if (newQuantity < 1) return; // Menge kleiner als 1 verhindern
    
    const token = localStorage.getItem("authToken");
    const sessionId = localStorage.getItem("sessionId");

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const payload = { productId, quantity: newQuantity };

    if (!token) {
      payload.sessionId = sessionId;
    }

    await axios.post("http://localhost:5001/cart", payload, { headers });
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: newQuantity } // Aktualisiere Menge lokal
          : item
      )
    );
  } catch (err) {
    console.error("Fehler beim Aktualisieren der Menge:", err);
    alert("Fehler beim Aktualisieren der Menge. Bitte versuchen Sie es erneut.");
  }
};

  const handleCheckout = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Bitte loggen Sie sich ein, um zur Kasse zu gehen.");
      navigate("/login");
    } else {
      navigate("/delivery-address");
    }
  };

  if (error) {
    return <p>{error}</p>;
  }

  if (cartItems.length === 0) {
    return <p>Ihr Warenkorb ist leer.</p>;
  }

  return (
    <div style={containerStyle}>
      <h1>Ihr Warenkorb</h1>
      <ul style={listStyle}>
        {cartItems.map((item) => (
          <li key={item.productId} style={itemStyle}>
            <img
              src={`http://localhost:5001${item.image}`}
              alt={item.name}
              style={imageStyle}
            />
            <div>
              <h2>{item.name}</h2>
              <p>{item.price} €</p>
              <div style={quantityContainerStyle}>
                <button
                  onClick={() =>
                    handleUpdateQuantity(item.productId, item.quantity - 1)
                  }
                  style={quantityButtonStyle}
                >
                  -
                </button>
                <span style={quantityValueStyle}>{item.quantity}</span>
                <button
                  onClick={() =>
                    handleUpdateQuantity(item.productId, item.quantity + 1)
                  }
                  style={quantityButtonStyle}
                >
                  +
                </button>
              </div>
              <button
                onClick={() => handleRemoveItem(item.productId)}
                style={removeButtonStyle}
              >
                Entfernen
              </button>
            </div>
          </li>
        ))}
      </ul>
      <h2>Gesamtpreis: {totalPrice.toFixed(2)} €</h2>
      <button onClick={handleCheckout} style={checkoutButtonStyle}>
        Weiter zur Kasse
      </button>
    </div>
  );
};

// Styles
const containerStyle = {
  maxWidth: "800px",
  margin: "0 auto",
  padding: "20px",
};

const listStyle = {
  listStyleType: "none",
  padding: 0,
};

const itemStyle = {
  display: "flex",
  alignItems: "center",
  marginBottom: "20px",
};

const imageStyle = {
  width: "100px",
  height: "100px",
  objectFit: "cover",
  marginRight: "20px",
};

const removeButtonStyle = {
  backgroundColor: "red",
  color: "white",
  border: "none",
  padding: "10px",
  cursor: "pointer",
};

const checkoutButtonStyle = {
  padding: "15px 30px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  cursor: "pointer",
  borderRadius: "5px",
};

const quantityContainerStyle = {
  display: "flex",
  alignItems: "center",
  marginTop: "10px",
};

const quantityButtonStyle = {
  backgroundColor: "#ddd",
  border: "none",
  padding: "5px 10px",
  cursor: "pointer",
};

const quantityValueStyle = {
  margin: "0 10px",
  fontWeight: "bold",
};

export default Cart;

