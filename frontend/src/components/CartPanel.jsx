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

            // 🔢 Calculate total dynamically
            const totalPrice = cart.items.reduce(
              (sum, item) => sum + item.price * item.quantity, 0
            );

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

                {/* 📦 Show item × quantity = subtotal */}
                <div className="cart-items-list">
                  {cart.items.map(item => (
                    <div key={item.id} className="cart-item">
                      <span>{item.name}</span>
                      <span>
                        {item.quantity} × ${item.price.toFixed(2)} = ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="cart-items-summary">
                  <span>{cart.items.length} items</span>
                  <span className="cart-total">Total: ${totalPrice.toFixed(2)}</span>
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
