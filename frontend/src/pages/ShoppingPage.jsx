// src/pages/ShoppingPage.jsx (updated)

import { useEffect } from "react";
import { useShoppingContext } from "../context/ShoppingContext";
import SelectedIngredientsPanel from "../components/SelectedIngredientsPanel";
import VendorDiscovery from "../components/VendorDiscovery";
import CartPanel from "../components/CartPanel";

function ShoppingPage() {
  const { 
    showIngredientsPanel,
    showCartPanel,
    getUserLocation,
    carts,
    isMobile,
    ingredientsPanelRef,
    cartPanelRef
  } = useShoppingContext();

  // Initialize the page - get user location and fetch vendors
  useEffect(() => {
    document.title = "Shopping | Ordelo";
    getUserLocation();
  }, [getUserLocation]);

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