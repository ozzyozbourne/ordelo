// src/pages/ShoppingPage.jsx (updated)

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useShoppingContext } from "../context/ShoppingContext";
import SelectedIngredientsPanel from "../components/SelectedIngredientsPanel";
import VendorDiscovery from "../components/VendorDiscovery";
import CartPanel from "../components/CartPanel";

function ShoppingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    showIngredientsPanel,
    showCartPanel,
    getUserLocation,
    carts,
    isMobile,
    ingredientsPanelRef,
    cartPanelRef,
    setVendors
  } = useShoppingContext();

  // Initialize the page - get user location and fetch vendors
  useEffect(() => {
    document.title = "Shopping | Ordelo";
    getUserLocation();

    // Check if we have store data from navigation
    if (location.state?.stores) {
      // Transform store data into vendor format
      const transformedVendors = location.state.stores.map(vendor => ({
        id: vendor.vendor_id,
        name: vendor.name || "Unnamed Vendor",
        stores: vendor.stores.map(store => ({
          id: store.store_id,
          name: store.name || "Unnamed Store",
          storeType: store.store_type,
          location: store.location,
          matchingItems: store.items.length,
          totalItems: store.items.length,
          totalPrice: store.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          availableItems: store.items.map(item => ({
            id: item.ingredient_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
            unitQuantity: item.unit_quantity
          }))
        }))
      }));

      setVendors(transformedVendors);
    } else {
      // If no store data, redirect back to shopping list
      navigate('/shopping-list');
    }
  }, [getUserLocation, location.state, navigate, setVendors]);

  // Only show cart panel if there are carts
  const hasActiveCarts = Object.keys(carts).length > 0;

  return (
    <div className="shopping-page">
      <div className={`shopping-layout ${showIngredientsPanel ? 'show-ingredients' : ''} ${hasActiveCarts && showCartPanel ? 'show-cart' : ''}`}>
        {/* Left Column - Ingredients */}
        <div 
          ref={ingredientsPanelRef}
          className={`ingredients-panel-container ${showIngredientsPanel ? 'expanded' : ''}`}
        >
          <SelectedIngredientsPanel />
        </div>

        {/* Middle Column - Vendor Discovery */}
        <div className="vendor-discovery-container">
          <VendorDiscovery />
        </div>

        {/* Right Column - Cart (only shown if there are carts) */}
        {hasActiveCarts && (
          <div 
            ref={cartPanelRef}
            className={`cart-panel-container ${showCartPanel ? 'expanded' : ''}`}
          >
            <CartPanel />
          </div>
        )}
      </div>
    </div>
  );
}

export default ShoppingPage;