import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import Catalog from "./pages/Catalog";
import ItemPage from "./pages/ItemPage";
import CartPage from './pages/CartPage'

import "./App.css";

function App() {
  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        
        <Route path="/catalog" element={<Catalog />} />
        
        <Route path="/catalog/:id" element={<ItemPage />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;