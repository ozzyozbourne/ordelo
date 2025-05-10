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

  const [showIngredientsPanel, setShowIngredientsPanel] = useState(true);
  const [showCartPanel, setShowCartPanel] = useState(true);

  const ingredientsPanelRef = useRef(null);
  const cartPanelRef = useRef(null);

  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [carts, setCarts] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle outside click to close panels on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleClickOutside = (event) => {
      if (
        showIngredientsPanel &&
        ingredientsPanelRef.current &&
        !ingredientsPanelRef.current.contains(event.target)
      ) {
        setShowIngredientsPanel(false);
      }

      if (
        showCartPanel &&
        cartPanelRef.current &&
        !cartPanelRef.current.contains(event.target)
      ) {
        setShowCartPanel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showIngredientsPanel, showCartPanel, isMobile]);

  // Map shopping list to selected ingredients
  useEffect(() => {
    if (shoppingList && shoppingList.length > 0) {
      const mappedIngredients = shoppingList.map((item) => ({
        ...item,
        selected: false,
        id: item.id || `temp-${Date.now()}-${Math.random()}`,
      }));
      setSelectedIngredients(mappedIngredients);
    }
  }, [shoppingList]);

  const toggleIngredientSelection = (ingredientId) => {
    setSelectedIngredients((prev) =>
      prev.map((ingredient) =>
        ingredient.id === ingredientId
          ? { ...ingredient, selected: !ingredient.selected }
          : ingredient
      )
    );
  };

  const fetchVendors = async (storeData) => {
    if (!user?.token) {
      console.error("User not authenticated");
      return;
    }

    try {
      if (!storeData) {
        const selectedItems = selectedIngredients.filter((item) => item.selected);

        if (selectedItems.length === 0) {
          console.log("No ingredients selected");
          return;
        }

        const requestBody = {
          compare: selectedItems.map((item) => ({
            name: item.name,
            unit_quantity: Math.round(item.amount || 1),
            unit: item.unit || "",
          })),
        };

        console.log("Request body:", JSON.stringify(requestBody, null, 2));

        const response = await fetch("http://localhost:8080/user/items/compare", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error response:", errorData);
          throw new Error(errorData.message || "Failed to compare items");
        }

        const data = await response.json();
        console.log("Response data:", data);

        if (!data.success) {
          throw new Error(data.error || "Failed to get store data");
        }

        if (!data.ids || data.ids === "null") {
          console.log("No stores found for the selected ingredients");
          setVendors([]);
          return;
        }

        storeData = JSON.parse(data.ids);
      }

      const transformedVendors = storeData.map((vendor) => ({
        id: vendor.user_id,
        name: vendor.name,
        stores: vendor.stores.map((store) => ({
          id: store.store_id,
          name: store.name,
          storeType: store.store_type,
          location: store.location,
          matchingItems: store.items.length,
          totalItems: store.items.length,
          totalPrice: store.items.reduce((sum, item) => sum + item.price, 0),
          availableItems: store.items.map((item) => ({
            id: item.ingredient_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
            unitQuantity: item.unit_quantity,
          })),
        })),
      }));

      setVendors(transformedVendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
    }
  };

  const addToCart = (vendorId, items) => {
    setCarts((prev) => {
      if (prev[vendorId]) {
        return {
          ...prev,
          [vendorId]: {
            ...prev[vendorId],
            items: [...prev[vendorId].items, ...items],
            totalPrice:
              prev[vendorId].totalPrice +
              items.reduce((sum, item) => sum + (item.price || 0), 0),
          },
        };
      }
  
      // Find the vendor and the correct store by vendorId (which is actually storeId)
      const vendor = vendors.find((v) =>
        v.stores.some((store) => store.id === vendorId)
      );
      const store = vendor?.stores.find((store) => store.id === vendorId);
  
      if (!store) {
        console.error("Store not found for vendorId:", vendorId);
        return prev;
      }
  
      return {
        ...prev,
        [vendorId]: {
          vendorId,
          vendorName: store.name,
           store_id: store.id,
          items,
          totalPrice: items.reduce((sum, item) => sum + (item.price || 0), 0),
        },
      };
    });
  
    setShowCartPanel(true);
  };
  const removeCart = (vendorId) => {
    setCarts((prev) => {
      const newCarts = { ...prev };
      delete newCarts[vendorId];
      return newCarts;
    });

    if (Object.keys(carts).length <= 1) {
      setShowCartPanel(false);
    }
  };

  const value = {
    showIngredientsPanel,
    setShowIngredientsPanel,
    showCartPanel,
    setShowCartPanel,
    selectedIngredients,
    setSelectedIngredients,
    vendors,
    setVendors,
    carts,
    setCarts,
    isMobile,
    ingredientsPanelRef,
    cartPanelRef,
    toggleIngredientSelection,
    fetchVendors,
    addToCart,
    removeCart,
  };
  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
};
