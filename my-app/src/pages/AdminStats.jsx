import React, { useEffect, useState } from 'react';

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5001/admin/stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Fehler beim Laden der Statistiken.');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1>Statistiken</h1>
      {loading && <p>Lade Statistiken...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && stats && (
        <div>
          <p>Anzahl Bestellungen: {stats.totalOrders}</p>
          <p>Umsatz: {stats.totalRevenue} €</p>
          <p>Anzahl Benutzer: {stats.totalUsers}</p>
          <h3>Top-Produkte:</h3>
          {stats.topProducts.length === 0 ? (
            <p>Keine Top-Produkte vorhanden.</p>
          ) : (
            <ul>
              {stats.topProducts.map((product) => (
                <li key={product._id}>{product.name} - Verkauft: {product.sold}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStats;

