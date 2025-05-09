import { useState } from "react";
import { useShoppingContext } from "../context/ShoppingContext";

function StoreCard({ store }) {
  const { addToCart } = useShoppingContext();

  const [quantities, setQuantities] = useState(
    store.availableItems.reduce((acc, item) => {
      acc[item.id] = 1; // default quantity is 1
      return acc;
    }, {})
  );

  const handleQuantityChange = (itemId, change) => {
    setQuantities(prev => {
      const newQty = Math.max(1, (prev[itemId] || 1) + change); // prevent going below 1
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleAddToCart = () => {
    const itemsWithQuantities = store.availableItems.map(item => ({
      ...item,
      quantity: quantities[item.id] || 1,
    }));
    addToCart(store.id, itemsWithQuantities);
  };

  const totalPrice = store.availableItems.reduce((sum, item) => {
    const qty = quantities[item.id] || 1;
    return sum + item.price * qty;
  }, 0);

  return (
    <div className="vendor-card">
      <div className="vendor-header">
        <span className="store-name">{store.name}</span>
        <div className="store-section">
          <div className="store-meta">
            <span className="store-type">{store.store_type}</span>
          </div>

          <div className="store-inventory">
            <div className="inventory-stats">
              <div className="price-info">
                <span className="total-price">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="store-inventory-grid">
              {store.availableItems.slice(0, 6).map(item => (
                <div key={item.id} className="inventory-item">
                  <span>{item.name}</span>
                  <span>${item.price.toFixed(2)}</span>
                  <div className="quantity-controls">
                    <button onClick={() => handleQuantityChange(item.id, -1)}>-</button>
                    <span>{quantities[item.id]}</span>
                    <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                  </div>
                </div>
              ))}
              {store.availableItems.length > 6 && (
                <div className="inventory-item more-items">
                  <span>+ {store.availableItems.length - 6} more items</span>
                </div>
              )}
            </div>
          </div>

          <div className="store-actions">
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              <i className="fas fa-cart-plus"></i> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StoreCard;
