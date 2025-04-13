// src/components/VendorDiscovery.jsx (fixed version)

import { useState } from "react";
import { useShoppingContext } from "../context/ShoppingContext";
import VendorCard from "./VendorCard";

function VendorDiscovery() {
  const { 
    vendors, 
    userLocation, 
    setRadius,
    showCartPanel, 
    setShowCartPanel,
    showIngredientsPanel,
    setShowIngredientsPanel,
    isMobile,
    carts // Add this to access carts data
  } = useShoppingContext();
  
  const [searchTerm, setSearchTerm] = useState("");
  
  // Calculate this inside VendorDiscovery component
  const hasActiveCarts = Object.keys(carts).length > 0;
  
  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.availableItems.some(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  return (
    <div className="vendor-discovery">
      {/* Desktop-only toggle controls - hidden on mobile */}
      {!isMobile && (
        <div className="vendor-panel-toggles" style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <button 
            className="toggle-btn left-toggle"
            onClick={() => setShowIngredientsPanel(!showIngredientsPanel)}
            style={{ background: "transparent", border: "none", color: "var(--primary-color)", fontSize: "1rem", cursor: "pointer" }}
          >
            Ingredients: {showIngredientsPanel ? "Close" : "Open"}
          </button>
          <button 
            className="toggle-btn right-toggle"
            onClick={() => setShowCartPanel(!showCartPanel)}
            style={{ background: "transparent", border: "none", color: "var(--primary-color)", fontSize: "1rem", cursor: "pointer" }}
          >
            Cart Panel: {showCartPanel ? "Close" : "Open"}
          </button>
        </div>
      )}

      {/* Mobile-only toggle buttons */}
      {isMobile && (
        <div className="mobile-panel-toggles" style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <button 
            className="mobile-toggle-btn"
            onClick={() => setShowIngredientsPanel(!showIngredientsPanel)}
            style={{ 
              background: "var(--primary-color)", 
              border: "none", 
              color: "white", 
              padding: "8px 12px", 
              borderRadius: "4px",
              fontSize: "0.9rem", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}
          >
            <i className="fas fa-list"></i>
            Ingredients
          </button>
          {hasActiveCarts && (
            <button 
              className="mobile-toggle-btn"
              onClick={() => setShowCartPanel(!showCartPanel)}
              style={{ 
                background: "var(--accent-color)", 
                border: "none", 
                color: "white", 
                padding: "8px 12px", 
                borderRadius: "4px",
                fontSize: "0.9rem", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <i className="fas fa-shopping-cart"></i>
              Cart
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
        
        <div className="location-container">
          <div className="location-info">
            <i className="fas fa-map-marker-alt"></i>
            <span>{userLocation.address || "Loading location..."}</span>
          </div>
          
          <div className="radius-selector">
            <span>Radius:</span>
            <select 
              value={userLocation.radius} 
              onChange={(e) => setRadius(Number(e.target.value))}
            >
              <option value={5}>5 miles</option>
              <option value={10}>10 miles</option>
              <option value={15}>15 miles</option>
              <option value={20}>20 miles</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="vendors-container">
        {filteredVendors.length > 0 ? (
          filteredVendors.map(vendor => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))
        ) : (
          <div className="no-vendors">
            <i className="fas fa-store-slash"></i>
            <h3>No vendors found</h3>
            <p>Try expanding your search radius or changing your location.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorDiscovery;