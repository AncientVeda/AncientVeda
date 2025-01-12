
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Klimaschutz from './pages/Klimaschutz';
import Support from './pages/Support';
import Bestseller from './pages/Bestseller';
import CategoriesPage from './pages/CategoriesPage'; // Importiere die neue Seite
import Angebote from './pages/Angebote';
import NewProductsPage from './pages/NewProductsPage';
import Cart from './pages/Cart';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DeliveryAddress from './pages/DeliveryAddress'; // Neue Komponente
import Payment from './pages/Payment'; // Neue Komponente
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminStats from './pages/AdminStats';
import Inventory from './pages/Inventory';
import AdminOrders from './pages/AdminOrders';
import AdminPayments from './pages/AdminPayments'; // Seite für Zahlungen
import AdminUsers from './pages/AdminUsers';
import AdminDeliveryAddresses from './pages/AdminDeliveryAddresses';
import AdminDiscounts from './pages/AdminDiscounts'; // Importiere die AdminDiscounts-Seite
import HeroSection from './components/HeroSection';
import ProductCarousel from './components/ProductCarousel';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import MyProfile from './components/MyProfile';
import Settings from './components/Settings'; // Importiere die Settings-Komponente
import Banner from './components/Banner';
import CategoriesSection from './components/CategoriesSection';
import BlogOverview from './pages/BlogOverview'; // Blog-Übersicht importieren
import BlogDetail from './pages/BlogDetail'; // Blog-Detailseite importieren
import axios from 'axios';

const App = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5001/products');
        setProducts(response.data);
        setLoading(false);
      } catch (err) {
        setError('Fehler beim Laden der Produkte.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

const ProtectedRoute = ({ element }) => {
  const isAuthenticated = !!localStorage.getItem('token'); // Beispiel: Überprüft, ob ein Token vorhanden ist
  return isAuthenticated ? element : <Navigate to="/login" />;
};


  return (
    <Router>
      <Header />
      <div style={{ backgroundColor: '#1e1e1e', minHeight: '100vh', color: '#fff' }}>
        <Routes>
          {/* Startseite mit Banner */}
          <Route
            path="/"
            element={
              <>
                <HeroSection />
                {loading ? (
                  <p style={{ textAlign: 'center', marginTop: '20px' }}>Lädt...</p>
                ) : error ? (
                  <p style={{ textAlign: 'center', color: 'red', marginTop: '20px' }}>{error}</p>
                ) : (
                  <ProductCarousel products={products} />
                )}
                <Banner />
                <CategoriesSection /> {/* Kategorien werden hier angezeigt */}
              </>
            }
          />

          {/* Ohne Banner */}
          <Route path="/produkte" element={<Products />} />
          <Route path="/produkte/:productId" element={<ProductDetail />} />

          {/* Weitere Seiten */}
          <Route path="/klimaschutz" element={<Klimaschutz />} />
          <Route path="/support" element={<Support />} />
          <Route path="/blog" element={<BlogOverview />} /> {/* Blog-Übersicht */}
          <Route path="/blog/:id" element={<BlogDetail />} /> {/* Blog-Detail */}
          <Route path="/bestseller" element={<Bestseller />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/angebote" element={<Angebote />} />
          <Route path="/neu" element={<NewProductsPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/delivery-address" element={<DeliveryAddress />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/settings" element={<Settings />} />
           
          {/* Adminbereich */}
          <Route
            path="/admin/*"
            element={
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="stats" element={<AdminStats />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="delivery-addresses" element={<AdminDeliveryAddresses />} />
                  <Route path="discounts" element={<AdminDiscounts />} />

                </Routes>
              </AdminLayout>
            }
          />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
};

export default App;

