// Modified ShoppingContext.jsx with outside click handling
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRecipes } from "./RecipeContext";
import { useAuth } from "./AuthContext";

// Create context
const ShoppingContext = createContext();

// Custom hook for using the shopping context
export const useShoppingContext = () => {
  const context = useContext(ShoppingContext);
  if (!context) {
    throw new Error("useShoppingContext must be used within a ShoppingProvider");
  }
  return context;
};

export const ShoppingProvider = ({ children }) => {
  const { shoppingList } = useRecipes();
  const { user } = useAuth();
  
  // State for managing selected ingredients panel visibility
  const [showIngredientsPanel, setShowIngredientsPanel] = useState(true);
  
  // State for managing cart panel visibility
  const [showCartPanel, setShowCartPanel] = useState(true);
  
  // References to the panels for outside click detection
  const ingredientsPanelRef = useRef(null);
  const cartPanelRef = useRef(null);
  
  // State for tracking selected ingredients
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  
  // State for storing vendors
  const [vendors, setVendors] = useState([]);
  
  // State for storing active carts by vendor
  const [carts, setCarts] = useState({});
  
  // State for tracking user location
  const [userLocation, setUserLocation] = useState({
    lat: null,
    lng: null,
    address: "",
    radius: 10 // Default radius in miles
  });
  
  // State to track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle click outside panels (mobile only)
  useEffect(() => {
    if (!isMobile) return; // Only apply on mobile
    
    const handleClickOutside = (event) => {
      // Check if click is outside ingredients panel
      if (showIngredientsPanel && 
          ingredientsPanelRef.current && 
          !ingredientsPanelRef.current.contains(event.target)) {
        setShowIngredientsPanel(false);
      }
      
      // Check if click is outside cart panel
      if (showCartPanel && 
          cartPanelRef.current && 
          !cartPanelRef.current.contains(event.target)) {
        setShowCartPanel(false);
      }
    };
    
    // Add click listener to document
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showIngredientsPanel, showCartPanel, isMobile]);
  
  // Load selected ingredients from shopping list
  useEffect(() => {
    if (shoppingList && shoppingList.length > 0) {
      // Map shopping list items to selected ingredients
      const mappedIngredients = shoppingList.map(item => ({
        ...item,
        selected: true, // Default all ingredients as selected
        id: item.id || `temp-${Date.now()}-${Math.random()}` // Ensure all items have an ID
      }));
      
      setSelectedIngredients(mappedIngredients);
    }
  }, [shoppingList]);
  
  // Function to toggle ingredient selection
  const toggleIngredientSelection = (ingredientId) => {
    setSelectedIngredients(prev => 
      prev.map(ing => 
        ing.id === ingredientId ? { ...ing, selected: !ing.selected } : ing
      )
    );
  };
  
  // Function to get user location
  const getUserLocation = () => {
    if (!user?.token) {
      console.error("User not authenticated");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
          
          // In a real app, you would reverse geocode to get the address
          // For now, we'll just set a placeholder
          setUserLocation(prev => ({
            ...prev,
            address: "Current Location"
          }));
          
          // Fetch vendors after getting location
          fetchVendors();
        },
        (error) => {
          console.error("Error getting location:", error);
          // If location access is denied, use a default location
          setUserLocation({
            lat: 37.7749, // Default to San Francisco
            lng: -122.4194,
            address: "San Francisco, CA",
            radius: 10
          });
          
          // Fetch vendors with default location
          fetchVendors();
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser");
      // Use default location
      setUserLocation({
        lat: 37.7749,
        lng: -122.4194,
        address: "San Francisco, CA",
        radius: 10
      });
      
      // Fetch vendors with default location
      fetchVendors();
    }
  };
  
  // Function to fetch vendors based on location and ingredients
  const fetchVendors = async (storeData) => {
    if (!user?.token) {
      console.error("User not authenticated");
      return;
    }

    try {
      if (!storeData) {
        // Get selected ingredients from the shopping list
        const selectedItems = selectedIngredients.filter(item => item.selected);
        
        if (selectedItems.length === 0) {
          console.log("No ingredients selected");
          return;
        }

        // Format the request body
        const requestBody = {
          compare: selectedItems.map(item => ({
            name: item.name,
            unit_quantity: Math.round(item.amount || 1),
            unit: item.unit || ''
          }))
        };

        console.log('Request body:', JSON.stringify(requestBody, null, 2)); // Debug log

        const response = await fetch("http://localhost:8080/user/items/compare", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData); // Debug log
          throw new Error(errorData.message || "Failed to compare items");
        }

        const data = await response.json();
        console.log('Response data:', data); // Debug log

        if (!data.success) {
          throw new Error(data.error || "Failed to get store data");
        }

        // Handle the case where ids is "null" or empty
        if (!data.ids || data.ids === "null") {
          console.log("No stores found for the selected ingredients");
          setVendors([]); // Set empty vendors array
          return;
        }

        // Parse the stringified JSON from data.ids
        storeData = JSON.parse(data.ids);
      }

      // Transform store data into vendor format
      const transformedVendors = storeData.map(vendor => ({
        id: vendor.user_id,
        name: vendor.name,
        stores: vendor.stores.map(store => ({
          id: store.store_id,
          name: store.name,
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
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]); // Set empty vendors array on error
    }
  };
  
  // Function to add items to a cart
  const addToCart = (vendorId, items) => {
    setCarts(prev => {
      // If vendor cart already exists, update it
      if (prev[vendorId]) {
        return {
          ...prev,
          [vendorId]: {
            ...prev[vendorId],
            items: [...prev[vendorId].items, ...items],
            totalPrice: prev[vendorId].totalPrice + items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          }
        };
      }
      
      // Otherwise, create a new cart for this vendor
      const vendor = vendors.find(v => v.id === vendorId);
      return {
        ...prev,
        [vendorId]: {
          vendorId,
          vendorName: vendor.name,
          items,
          totalPrice: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        }
      };
    });
    
    // Ensure cart panel is visible when adding to cart
    setShowCartPanel(true);
  };
  
  // Function to remove a cart
  const removeCart = (vendorId) => {
    setCarts(prev => {
      const newCarts = { ...prev };
      delete newCarts[vendorId];
      return newCarts;
    });
    
    // If no carts left, hide the cart panel
    if (Object.keys(carts).length <= 1) {
      setShowCartPanel(false);
    }
  };
  
  // Function to update location radius
  const setRadius = (miles) => {
    setUserLocation(prev => ({
      ...prev,
      radius: miles
    }));
    
    // Refetch vendors with new radius
    fetchVendors();
  };
  
  // Value object to provide through context
  const value = {
    showIngredientsPanel,
    setShowIngredientsPanel,
    showCartPanel,
    setShowCartPanel,
    selectedIngredients,
    toggleIngredientSelection,
    vendors,
    fetchVendors,
    carts,
    addToCart,
    removeCart,
    userLocation,
    getUserLocation,
    setRadius,
    isMobile,
    ingredientsPanelRef,
    cartPanelRef
  };
  
  return (
    <ShoppingContext.Provider value={value}>
      {children}
    </ShoppingContext.Provider>
  );
};