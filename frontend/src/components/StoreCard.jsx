import { useState } from "react";
import { useShoppingContext } from "../context/ShoppingContext";

function StoreCard({ store, vendorName }) {
  const { addToCart } = useShoppingContext();

  const [quantities, setQuantities] = useState(
    store.availableItems.reduce((acc, item) => {
      acc[item.id] = 1; // default quantity is 1
      return acc;
    }, {})
  );
  const [expanded, setExpanded] = useState(false);

  const handleQuantityChange = (itemId, change) => {
    setQuantities(prev => {
      const newQty = Math.max(0, (prev[itemId] ?? 1) + change);
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleAddToCart = () => {
    const itemsWithQuantities = store.availableItems.map(item => ({
      ...item,
      quantity: quantities[item.id] ?? 1,
    }));
    addToCart(store.id, itemsWithQuantities);
  };

  const totalPrice = store.availableItems.reduce((sum, item) => {
    const qty = quantities[item.id] ?? 1;
    return sum + item.price * qty;
  }, 0);

  // Determine items to show
  const itemsToShow = expanded ? store.availableItems : store.availableItems.slice(0, 2);

  return (
    <div className="vendor-card" style={{ padding: 20, borderRadius: 18, boxShadow: '0 2px 12px #0001', background: '#fff' }}>
      {/* Header: Store name and vendor name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8 }}>
        <span className="store-name" style={{ fontWeight: 600, fontSize: '1.15rem', color: '#222', marginBottom: 2 }}>{store.name}</span>
        {store.distance !== null && (
          <span className="store-distance" style={{ fontSize: '0.85rem', color: '#777', marginLeft: '10px' }}>
            ({store.distance} mi away)
          </span>
        )}
      </div>
      <div className="store-section" style={{ width: '100%' }}>
        <div className="store-meta" style={{ marginBottom: 8 }}>
          <span className="store-type" style={{ fontSize: '0.92rem', color: 'var(--primary-color, #5ecc62)' }}>{store.store_type}</span>
        </div>

        <div className="store-inventory">
          <div className="store-inventory-grid" style={{ marginBottom: 8 }}>
            {itemsToShow.map(item => (
              <div key={item.id} className="inventory-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0' }}>
                <span style={{ flex: 1, fontSize: '1rem', color: '#222' }}>{item.name}</span>
                <span style={{ minWidth: 60, textAlign: 'right', color: '#444', fontSize: '0.98rem' }}>${item.price.toFixed(2)}</span>
                <div className="quantity-controls" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button style={{ padding: '2px 7px', borderRadius: 4, border: '1px solid #eee', background: '#f8f8f8', color: '#444', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleQuantityChange(item.id, -1)}>-</button>
                  <span style={{ minWidth: 18, textAlign: 'center', fontSize: '0.98rem' }}>{quantities[item.id]}</span>
                  <button style={{ padding: '2px 7px', borderRadius: 4, border: '1px solid #eee', background: '#f8f8f8', color: '#444', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                </div>
              </div>
            ))}
            {store.availableItems.length > 2 && (
              <div
                className="inventory-item more-items"
                style={{ cursor: 'pointer', color: 'var(--primary-color, #5ecc62)', fontSize: '0.97rem', textDecoration: 'underline', background: 'none', padding: 0, marginTop: 2 }}
                onClick={() => setExpanded(e => !e)}
              >
                {expanded ? <span>Show less</span> : <span>+ {store.availableItems.length - 2} more {store.availableItems.length - 2 === 1 ? 'item' : 'items'}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Price and Add to Cart at the bottom, side by side */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, width: '100%' }}>
          <div className="price-info">
            <span className="total-price" style={{ fontWeight: 600, fontSize: '1.15rem', color: '#222' }}>${totalPrice.toFixed(2)}</span>
          </div>
          <button className="add-to-cart-btn" style={{ padding: '10px 22px', borderRadius: 12, fontSize: '1.05rem', background: 'var(--primary-color, #5ecc62)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleAddToCart}>
            <i className="fas fa-cart-plus"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default StoreCard;
