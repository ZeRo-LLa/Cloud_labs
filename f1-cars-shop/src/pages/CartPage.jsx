import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { removeFromCart, incrementQuantity, decrementQuantity } from '../store/cartSlice';

function CartPage() {
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

  return (
    <div style={{ padding: '40px' }}>
      <h1>Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <p>Your cart is empty. <Link to="/catalog">Go buy some F1 cars!</Link></p>
      ) : (
        <div className="cart-list">
          {cartItems.map((item) => (
            <div key={item.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              borderBottom: '1px solid #ccc',
              padding: '15px 0'
            }}>
              <img src={item.image} alt={item.name} style={{ width: '100px', borderRadius: '8px' }} />
              
              <div style={{ flex: 1, marginLeft: '20px' }}>
                <h3>{item.name}</h3>
                <p>Engine: {item.engine}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => dispatch(decrementQuantity(item.id))}>-</button>
                
                <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                    {item.quantity}
                </span>
                
                <button onClick={() => dispatch(incrementQuantity(item.id))}>+</button>
              </div>

              <button 
                onClick={() => dispatch(removeFromCart(item.id))}
                style={{ marginLeft: '20px', color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Remove
              </button>
            </div>
          ))}
          
<div style={{ marginTop: '30px', textAlign: 'right' }}>
<h2>Total: ${totalAmount.toLocaleString()}</h2>
   
   <h2 style={{ color: '#E10600' }}>Total Price: ${totalAmount}</h2>

   <div style={{ marginTop: '20px' }}>
      <Link to="/catalog" style={{ marginRight: '20px', textDecoration: 'none', color: '#555' }}>
          Continue Shopping
      </Link>
      <button style={{ 
          padding: '10px 25px', 
          backgroundColor: '#E10600', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
      }}>
          Checkout
      </button>
   </div>
</div>
        </div>
      )}
    </div>
  );
}

export default CartPage;