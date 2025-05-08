// src/components/VendorCard.jsx

import { useShoppingContext } from "../context/ShoppingContext";

function VendorCard({ vendor }) {
  const { addToCart } = useShoppingContext();
  
  return (
    <div className="vendor-card">
      <div className="vendor-header">
        <h3 className="vendor-name">{vendor.name}</h3>
        {vendor.stores.map(store => (
          <div key={store.id} className="store-section">
            <div className="store-meta">
              <span className="store-name">{store.name}</span>
              <span className="store-type">{store.storeType}</span>
              {store.location && (
                <span className="store-location">
                  <i className="fas fa-map-marker-alt"></i> 
                  {store.location.coordinates[1].toFixed(2)}°N, 
                  {store.location.coordinates[0].toFixed(2)}°W
                </span>
              )}
            </div>
            
            <div className="store-inventory">
              <div className="inventory-stats">
                <div className="match-percentage">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(store.matchingItems / store.totalItems) * 100}%` }}
                    ></div>
                  </div>
                  <span className="match-text">
                    {store.matchingItems} of {store.totalItems} items available
                  </span>
                </div>
                <div className="price-info">
                  <span className="total-price">${store.totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="store-inventory-grid">
                {store.availableItems.slice(0, 6).map(item => (
                  <div key={item.id} className="inventory-item">
                    <span>{item.name}</span>
                    <span>${item.price.toFixed(2)}</span>
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
              <button 
                className="add-to-cart-btn"
                onClick={() => addToCart(store.id, store.availableItems)}
              >
                <i className="fas fa-cart-plus"></i> Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorCard;