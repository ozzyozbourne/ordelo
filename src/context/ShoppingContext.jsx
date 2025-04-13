// Modified ShoppingContext.jsx with outside click handling
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRecipes } from "./RecipeContext";

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
  
  // Function to fetch vendors based on location and ingredients
  const fetchVendors = async () => {
    try {
      // In a real app, this would be an API call
      // For now, let's simulate with mock data
      const mockVendors = [
        {
          id: "v1",
          name: "Whole Foods Market",
          distance: 2.3, // miles
          address: "123 Main St",
          matchingItems: 18,
          totalItems: 25,
          totalPrice: 65.43,
          availableItems: [
            { id: 1, name: "Organic Chicken", price: 12.99, quantity: 1 },
            { id: 2, name: "Fresh Spinach", price: 3.99, quantity: 1 },
            // More items would be here
          ]
        },
        {
          id: "v2",
          name: "Trader Joe's",
          distance: 3.7,
          address: "456 Market Ave",
          matchingItems: 20,
          totalItems: 25,
          totalPrice: 58.75,
          availableItems: [
            { id: 1, name: "Organic Chicken", price: 11.99, quantity: 1 },
            { id: 3, name: "Olive Oil", price: 8.99, quantity: 1 },
            // More items would be here
          ]
        },
        {
          id: "v3",
          name: "Local Farmer's Market",
          distance: 5.2,
          address: "789 Farm Rd",
          matchingItems: 15,
          totalItems: 25,
          totalPrice: 52.30,
          availableItems: [
            { id: 2, name: "Fresh Spinach", price: 2.99, quantity: 1 },
            { id: 4, name: "Free Range Eggs", price: 4.99, quantity: 1 },
            // More items would be here
          ]
        }
      ];
      
      setVendors(mockVendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
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
  
  // Function to get user location
  const getUserLocation = () => {
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