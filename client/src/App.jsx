import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderConfirmation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
