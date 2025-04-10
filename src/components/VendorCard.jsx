// src/components/VendorCard.jsx

import { useShoppingContext } from "../context/ShoppingContext";

function VendorCard({ vendor }) {
  const { addToCart } = useShoppingContext();
  
  // Calculate the percentage of matching items
  const matchPercentage = (vendor.matchingItems / vendor.totalItems) * 100;
  
  const handleAddToCart = () => {
    addToCart(vendor.id, vendor.availableItems);
  };
  
  return (
    <div className="vendor-card">
      <div className="vendor-header">
        <h3 className="vendor-name">{vendor.name}</h3>
        <div className="vendor-meta">
          <span className="vendor-distance">
            <i className="fas fa-map-marker-alt"></i> {vendor.distance.toFixed(1)} miles
          </span>
          <span className="vendor-address">
            <i className="fas fa-location-dot"></i> {vendor.address}
          </span>
        </div>
      </div>
      
      <div className="vendor-inventory">
        <div className="inventory-stats">
          <div className="match-percentage">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${matchPercentage}%` }}
              ></div>
            </div>
            <span className="match-text">
              {vendor.matchingItems} of {vendor.totalItems} items available
            </span>
          </div>
          <div className="price-info">
            <span className="total-price">${vendor.totalPrice.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="vendor-inventory-grid">
          {vendor.availableItems.slice(0, 6).map(item => (
            <div key={item.id} className="inventory-item">
              <span>{item.name}</span>
              <span>${item.price.toFixed(2)}</span>
            </div>
          ))}
          {vendor.availableItems.length > 6 && (
            <div className="inventory-item more-items">
              <span>+ {vendor.availableItems.length - 6} more items</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="vendor-actions">
        <button 
          className="add-to-cart-btn"
          onClick={handleAddToCart}
        >
          <i className="fas fa-cart-plus"></i> Add to Cart
        </button>
      </div>
    </div>
  );
}

export default VendorCard;