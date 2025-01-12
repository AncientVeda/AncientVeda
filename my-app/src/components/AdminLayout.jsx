import React from 'react';
import styles from '../styles/AdminLayout.module.css'; // CSS-Datei für AdminLayout

const AdminLayout = ({ children }) => {
  return (
    <div className={styles.adminContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <h2>Admin Panel</h2>
        <ul>
          <li><a href="/admin">Dashboard</a></li>
          <li><a href="/admin/products">Produkte</a></li>
          <li><a href="/admin/categories">Kategorien</a></li>
          <li><a href="/admin/stats">Statistiken</a></li>
          <li><a href="/admin/inventory">Inventory</a></li>
          <li><a href="/admin/orders">Orders</a></li>
          <li><a href="/admin/payments">Payments</a></li>
          <li><a href="/admin/users">Users</a></li>
          <li><a href="/admin/delivery-addresses">Delivery Addresses</a></li>
          <li><a href="/admin/discounts">Discounts</a></li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;

