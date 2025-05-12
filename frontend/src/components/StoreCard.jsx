import { useState } from "react";
import { useShoppingContext } from "../context/ShoppingContext";
import { useAuth } from "../context/AuthContext";

function StoreCard({ store, vendorId }) {
  const { addToCart } = useShoppingContext();
  const { user } = useAuth();

  const [availableItems, setAvailableItems] = useState(store.availableItems);
  const [quantities, setQuantities] = useState(
    store.availableItems.reduce((acc, item) => {
      acc[item.id || item.ingredient_id] = 1;
      return acc;
    }, {})
  );
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedItems, setFetchedItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState(new Set());

  const handleQuantityChange = (itemId, change) => {
    setQuantities(prev => {
      const newQty = Math.max(0, (prev[itemId] ?? 1) + change);
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleAddToCart = () => {
    const itemsWithQuantities = availableItems
      .filter(item => quantities[item.id || item.ingredient_id] > 0)
      .map(item => ({
        ...item,
        quantity: quantities[item.id || item.ingredient_id],
      }));

    if (itemsWithQuantities.length > 0) {
      addToCart(store.id, itemsWithQuantities);
    }
  };

  const handleView = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `http://localhost:8080/vendor/${vendorId}/store/${store.id}/items`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch store items");
      const data = await response.json();
      const parsedItems = JSON.parse(data.ids);
      const existingIds = new Set(availableItems.map(item => item.id || item.ingredient_id));
      const newItems = parsedItems.filter(item => !existingIds.has(item.ingredient_id));

      setFetchedItems(newItems);
      setShowModal(true);
    } catch (err) {
      setError("Failed to load store items");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = availableItems.reduce((sum, item) => {
    const qty = quantities[item.id || item.ingredient_id] ?? 1;
    return sum + item.price * qty;
  }, 0);

  const itemsToShow = expanded ? availableItems : availableItems.slice(0, 2);

  return (
    <>
      <div className="vendor-card" style={{ padding: 20, borderRadius: 18, boxShadow: '0 2px 12px #0001', background: '#fff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8 }}>
          <span className="store-name" style={{ fontWeight: 600, fontSize: '1.15rem', color: '#222', marginBottom: 2 }}>{store.name}</span>
        </div>

        <div className="store-section" style={{ width: '100%' }}>
          <div className="store-meta" style={{ marginBottom: 8 }}>
            <span className="store-type" style={{ fontSize: '0.92rem', color: 'var(--primary-color, #5ecc62)' }}>{store.store_type}</span>
          </div>

          <div className="store-inventory">
            <div className="store-inventory-grid" style={{ marginBottom: 8 }}>
              {itemsToShow.map(item => (
                <div key={item.id || item.ingredient_id} className="inventory-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0' }}>
                  <span style={{ flex: 1, fontSize: '1rem', color: '#222' }}>
                    {item.name} 
              {(item.unit_quantity || item.unitQuantity) && item.unit && (
  <span style={{ fontSize: '0.9rem', color: '#666' }}>
    &nbsp;({item.unit_quantity || item.unitQuantity} {item.unit})
  </span>
)}
                  </span>
                  <span style={{ minWidth: 60, textAlign: 'right', color: '#444', fontSize: '0.98rem' }}>${item.price.toFixed(2)}</span>
                  <div className="quantity-controls" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button style={{ padding: '2px 7px', borderRadius: 4, border: '1px solid #eee', background: '#f8f8f8', color: '#444', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleQuantityChange(item.id || item.ingredient_id, -1)}>-</button>
                    <span style={{ minWidth: 18, textAlign: 'center', fontSize: '0.98rem' }}>{quantities[item.id || item.ingredient_id]}</span>
                    <button style={{ padding: '2px 7px', borderRadius: 4, border: '1px solid #eee', background: '#f8f8f8', color: '#444', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleQuantityChange(item.id || item.ingredient_id, 1)}>+</button>
                  </div>
                </div>
              ))}
              {availableItems.length > 2 && (
                <div
                  className="inventory-item more-items"
                  style={{ cursor: 'pointer', color: 'var(--primary-color, #5ecc62)', fontSize: '0.97rem', textDecoration: 'underline', background: 'none', padding: 0, marginTop: 2 }}
                  onClick={() => setExpanded(e => !e)}
                >
                  {expanded ? <span>Show less</span> : <span>+ {availableItems.length - 2} more {availableItems.length - 2 === 1 ? 'item' : 'items'}</span>}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, width: '100%' }}>
            <div className="price-info">
              <span className="total-price" style={{ fontWeight: 600, fontSize: '1.15rem', color: '#222' }}>${totalPrice.toFixed(2)}</span>
            </div>
            <button className="add-to-cart-btn" style={{ padding: '5px 11px', borderRadius: 6, fontSize: '0.75rem', background: '#ffa500', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleView}>
              {loading ? "Loading..." : "View"}
            </button>
            <button className="add-to-cart-btn" style={{ padding: '10px 22px', borderRadius: 12, fontSize: '1.05rem', background: 'var(--primary-color, #5ecc62)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleAddToCart}>
              <i className="fas fa-cart-plus"></i> Add to Cart
            </button>
          </div>
          {error && <div style={{ marginTop: 10, color: 'red' }}>{error}</div>}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%',
          height: '100%', backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: '#fff', padding: 20, borderRadius: 12,
            maxWidth: 500, width: '90%', maxHeight: '80vh', overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: 12 }}>New Ingredients</h3>
            {fetchedItems.length === 0 ? (
              <p>No new ingredients available.</p>
            ) : (
              fetchedItems.map(item => (
                <div key={item.ingredient_id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8, borderBottom: '1px solid #eee', paddingBottom: 6
                }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {item.name} {item.unit_quantity && item.unit ? `(${item.unit_quantity} ${item.unit})` : ''}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#555' }}>${item.price}</div>
                  </div>
                  {addedItemIds.has(item.ingredient_id) ? (
                    <span style={{ fontSize: '0.85rem', color: 'green', fontWeight: 600 }}>Added ✅</span>
                  ) : (
                    <button
                      onClick={() => {
                        setAvailableItems(prev => [...prev, item]);
                        setQuantities(prev => ({ ...prev, [item.ingredient_id]: 1 }));
                        setAddedItemIds(prev => new Set(prev).add(item.ingredient_id));
                      }}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#5ecc62',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 5,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Add
                    </button>
                  )}
                </div>
              ))
            )}
            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: 16,
                padding: '8px 16px',
                backgroundColor: '#ffa500',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default StoreCard;
