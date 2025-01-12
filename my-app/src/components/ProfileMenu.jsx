import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileMenu = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Schließen des Menüs bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      {/* Profil-Icon */}
      <button
        onClick={toggleMenu}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
        }}
      >
        <img
          src="user.svg" // Icon-Pfad anpassen
          alt="Profil"
          style={{ width: '24px', height: '24px' }}
        />
      </button>

      {/* Dropdown-Menü */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: '0',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '5px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            width: '200px',
            zIndex: 1000,
          }}
        >
          <ul style={{ listStyle: 'none', margin: 0, padding: '10px' }}>
            <li style={{ marginBottom: '10px' }}>
              <button
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setIsOpen(false);
                  navigate('/profile'); // Navigiert zur Profilseite
                }}
              >
                Mein Profil
              </button>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <button
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setIsOpen(false);
                  navigate('/settings'); // Navigiert zur Einstellungsseite
                }}
              >
                Einstellungen
              </button>
            </li>
            <li>
              <button
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'red',
                }}
                onClick={() => {
                  onLogout();
                  alert('Logout erfolgreich');
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;

