// src/components/CartPanel.jsx

import { useShoppingContext } from "../context/ShoppingContext";

function CartPanel() {
  const { 
    carts, 
    removeCart, 
    showCartPanel, 
    setShowCartPanel 
  } = useShoppingContext();
  
  const cartVendors = Object.keys(carts);
  const cartCount = cartVendors.length;
  
  return (
    <div className="cart-panel">
      <div className="panel-header">
        <h2>Your Carts</h2>
        <span className="cart-count">{cartCount}</span>
      </div>
      
      <div className="carts-container">
        {cartCount > 0 ? (
          cartVendors.map(vendorId => {
            const cart = carts[vendorId];
            return (
              <div key={vendorId} className="cart-card">
                <div className="cart-header">
                  <h3>{cart.vendorName}</h3>
                  <button 
                    className="remove-cart-btn"
                    onClick={() => removeCart(vendorId)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
                
                <div className="cart-items-summary">
                  <span>{cart.items.length} items</span>
                  <span className="cart-total">${cart.totalPrice.toFixed(2)}</span>
                </div>
                
                <button className="checkout-btn">
                  <i className="fas fa-shopping-bag"></i> Checkout
                </button>
              </div>
            );
          })
        ) : (
          <div className="empty-cart">
            <i className="fas fa-shopping-cart"></i>
            <p>Your cart is empty</p>
            <p>Add items from the vendor list</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPanel;