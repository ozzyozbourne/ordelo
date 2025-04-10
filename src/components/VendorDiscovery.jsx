// src/components/VendorDiscovery.jsx

import { useState } from "react";
import { useShoppingContext } from "../context/ShoppingContext";
import VendorCard from "./VendorCard";

function VendorDiscovery() {
  const { vendors, userLocation, setRadius } = useShoppingContext();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.availableItems.some(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  return (
    <div className="vendor-discovery">
      <h1 className="page-title">
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