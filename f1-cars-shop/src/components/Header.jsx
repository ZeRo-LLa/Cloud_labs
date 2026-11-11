import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

function Header() {
  const cartItems = useSelector((state) => state.cart.items);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="header" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '0 20px',
      backgroundColor: '#111',
      color: 'white'
    }}>
      <h1>F1 Cars Store</h1>
      
      <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
        <Link to="/catalog" style={{ color: 'white', textDecoration: 'none' }}>Catalog</Link>
        
        <Link to="/cart" className="cart-link" style={{ 
          color: '#E10600', 
          textDecoration: 'none', 
          fontWeight: 'bold',
          fontSize: '1.1rem'
        }}>
          Cart {totalItems > 0 && `(${totalItems})`}
        </Link>
      </nav>
    </header>
  );
}

export default Header;