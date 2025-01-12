import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AdminUsers.module.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]); // Benutzerliste
  const [loading, setLoading] = useState(true); // Ladeanzeige
  const [error, setError] = useState(''); // Fehlermeldungen
  const [searchTerm, setSearchTerm] = useState(''); // Suchbegriff

  // Benutzer beim Laden der Komponente abrufen
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:5001/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Abrufen der Benutzer:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Fehler beim Laden der Benutzer.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className={styles.loading}>Lädt Benutzer...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h1>Benutzer verwalten</h1>
      <input
        type="text"
        placeholder="Suchen nach Name, E-Mail oder Rolle..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchInput}
      />
      {filteredUsers.length === 0 ? (
        <p className={styles.noUsers}>Keine Benutzer gefunden.</p>
      ) : (
        <table className={styles.userTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Adresse</th>
              <th>Stadt</th>
              <th>PLZ</th>
              <th>Telefon</th>
              <th>Geburtsdatum</th>
              <th>Rolle</th>
              <th>Erstellt am</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.address || '-'}</td>
                <td>{user.city || '-'}</td>
                <td>{user.zipCode || '-'}</td>
                <td>{user.phone || '-'}</td>
                <td>{user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '-'}</td>
                <td>{user.role}</td>
                <td>{new Date(user.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsers;

