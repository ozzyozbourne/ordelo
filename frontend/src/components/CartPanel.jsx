import { useShoppingContext } from "../context/ShoppingContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function CartPanel() {
  const navigate = useNavigate();
  const { 
    carts, 
    removeCart, 
    showCartPanel, 
    setShowCartPanel, 
    vendors 
  } = useShoppingContext();
  
  const { user } = useAuth();

  const cartVendors = Object.keys(carts);
  const navigate = useNavigate();
  const cartCount = cartVendors.length;

  const handleCheckout = async (vendor_id) => {
    const cart = carts[vendor_id];
    if (!cart) {
      console.error("Cart not found for vendor:", vendor_id);
      return;
    }

    // Find the vendor and store information
    const vendor = vendors.find((v) =>
      v.stores.some((store) => store.id === vendor_id)
    );
    const store = vendor?.stores.find((store) => store.id === vendor_id);

    if (!vendor || !store) {
      console.error("Vendor or store not found");
      return;
    }

    // Calculate totalPrice directly from cart items
    const totalPrice = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create the order object with the correct structure
    const order = {
      store_id: vendor_id, // This is the store ID
      delivery_method: "Deliver",
      order_status: "pending",
      total_price: totalPrice,
      items: cart.items.map(item => ({
        ingredient_id: item.id,
        name: item.name,
        unit_quantity: item.unitQuantity,
        unit: item.unit,
        price: item.price,
        quantity: item.quantity || 1 // Added fallback for quantity
      })),
      vendor_id: vendor.id, // This is the vendor ID
      payment_status: "success"
    };

    try {
      // Log the request payload for debugging
      console.log('Sending order:', JSON.stringify({ orders: [order] }, null, 2));

      const response = await fetch("http://localhost:8080/user/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ orders: [order] })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Order creation failed:', errorData);
        throw new Error(errorData.message || "Failed to place order");
      }

      const result = await response.json();
      console.log("Order success:", result);
      removeCart(vendor_id);

    } catch (error) {
      console.error("Checkout error:", error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="cart-panel">
      <div className="panel-header">
        <h2>Your Carts</h2>
        <span className="cart-count">{cartCount}</span>
      </div>
      
      <div className="carts-container">
        {cartCount > 0 ? (
          cartVendors.map(vendor_id => {
            const cart = carts[vendor_id];
            const totalPrice = cart.items.reduce(
              (sum, item) => sum + item.price * (item.quantity || 1), 0
            );

            return (
              <div key={vendor_id} className="cart-card">
                <div className="cart-header">
                  <h3>{cart.vendorName}</h3>
                  <button 
                    className="remove-cart-btn"
                    onClick={() => removeCart(vendor_id)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>

                <div className="cart-items-list">
                  {cart.items.map(item => (
                    <div key={item.id} className="cart-item">
                      <span>{item.name}</span>
                      <span>
                        {item.quantity || 1} × ${item.price.toFixed(2)} = ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="cart-items-summary">
                  <span>{cart.items.length} items</span>
                  <span className="cart-total">Total: ${totalPrice.toFixed(2)}</span>
                </div>

                <button 
                  className="checkout-btn" 
                  onClick={() => handleCheckout(vendor_id)}
                >
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