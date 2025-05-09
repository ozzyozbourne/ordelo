import { useState } from "react";
import { useShoppingContext } from "../context/ShoppingContext";
import StoreCard from "./StoreCard";

function VendorDiscovery() {
  const { 
    vendors, 
    showCartPanel, 
    setShowCartPanel,
    showIngredientsPanel,
    setShowIngredientsPanel,
    isMobile,
    carts,
  } = useShoppingContext();
  
  const [searchTerm, setSearchTerm] = useState("");

  const hasActiveCarts = Object.keys(carts).length > 0;

  // Flatten all stores and attach vendor name to each
  const allStores = vendors.flatMap((vendor) =>
    vendor.stores
      .filter(store => 
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.availableItems.some(item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      .map((store) => ({
        ...store,
        vendorName: vendor.name,
      }))
  );

  return (
    <div className="vendor-discovery">
      {/* Desktop-only toggle controls */}
      {!isMobile && (
        <div className="panel-toggles">
          <button 
            className="toggle-btn left-toggle"
            onClick={() => setShowIngredientsPanel(!showIngredientsPanel)}
          >
            Ingredients: {showIngredientsPanel ? "Close" : "Open"}
          </button>
          <button 
            className="toggle-btn right-toggle"
            onClick={() => setShowCartPanel(!showCartPanel)}
          >
            Cart Panel: {showCartPanel ? "Close" : "Open"}
          </button>
        </div>
      )}

      {/* Mobile-only toggles */}
      {isMobile && (
        <div className="panel-toggles">
          <button 
            className="mobile-toggle-btn"
            onClick={() => setShowIngredientsPanel(!showIngredientsPanel)}
          >
            <i className="fas fa-list"></i> Ingredients
          </button>
          {hasActiveCarts && (
            <button 
              className="mobile-toggle-btn accent"
              onClick={() => setShowCartPanel(!showCartPanel)}
            >
              <i className="fas fa-shopping-cart"></i> Cart
            </button>
          )}
        </div>
      )}

      <h1 className="shopping-page-title">
        <i className="fas fa-store"></i> Shop Ingredients
      </h1>

      <div className="search-location-container">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search for items or stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-button">
            <i className="fas fa-search"></i>
          </button>
        </div>
      </div>

      <div className="vendors-container">
        {allStores.length > 0 ? (
          allStores.map(store => (
            <StoreCard key={store.id} store={store} />
          ))
        ) : (
          <div className="empty-state">
            <i className="fas fa-store-slash empty-icon"></i>
            <h3>No stores found</h3>
            <p>Try expanding your search radius or changing your keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorDiscovery;
