// src/pages/ShoppingList.jsx

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRecipes } from "../context/RecipeContext";
import { Link } from "react-router-dom";
import "../styles/ShoppingList.css"; // Import the CSS only in this component

// Define vague food categories for grouping
const FOOD_CATEGORIES = {
  PRODUCE: "Produce",
  DAIRY: "Dairy",
  MEAT: "Meat & Seafood",
  PANTRY: "Pantry",
  CONDIMENTS: "Condiments & Spices",
  OTHER: "Other"
};

// Function to categorize items based on name and aisle into vague categories
const categorizeItem = (item) => {
  const name = item.name?.toLowerCase() || "";
  const aisle = item.aisle?.toLowerCase() || "";
  
  if (
    aisle.includes("produce") || 
    name.includes("vegetable") || 
    name.includes("fruit") ||
    name.includes("fresh") ||
    name.includes("lettuce") ||
    name.includes("tomato") ||
    name.includes("onion") ||
    name.includes("garlic") ||
    name.includes("lemon") ||
    name.includes("zest")
  ) {
    return FOOD_CATEGORIES.PRODUCE;
  }
  
  if (
    aisle.includes("dairy") || 
    aisle.includes("cheese") || 
    name.includes("milk") || 
    name.includes("cheese") || 
    name.includes("butter") ||
    name.includes("yogurt") ||
    name.includes("cream")
  ) {
    return FOOD_CATEGORIES.DAIRY;
  }
  
  if (
    aisle.includes("meat") || 
    aisle.includes("seafood") || 
    name.includes("chicken") || 
    name.includes("beef") || 
    name.includes("fish") ||
    name.includes("pork") ||
    name.includes("lamb") ||
    name.includes("turkey")
  ) {
    return FOOD_CATEGORIES.MEAT;
  }
  
  if (
    aisle.includes("spice") || 
    aisle.includes("condiment") || 
    name.includes("salt") || 
    name.includes("pepper") || 
    name.includes("spice") ||
    name.includes("sauce") ||
    name.includes("oil") ||
    name.includes("vinegar") ||
    name.includes("dressing")
  ) {
    return FOOD_CATEGORIES.CONDIMENTS;
  }
  
  if (
    aisle.includes("canned") || 
    aisle.includes("dry") || 
    aisle.includes("pasta") || 
    aisle.includes("grains") ||
    name.includes("pasta") ||
    name.includes("rice") ||
    name.includes("bean") ||
    name.includes("canned") ||
    name.includes("flour") ||
    name.includes("sugar") ||
    name.includes("cereal")
  ) {
    return FOOD_CATEGORIES.PANTRY;
  }
  
  return FOOD_CATEGORIES.OTHER;
};

// Helper function to merge quantities for same items
const mergeIngredients = (ingredients) => {
  const mergedMap = {};
  
  ingredients.forEach(ingredient => {
    // Skip null or undefined ingredients
    if (!ingredient) return;
    
    // Create a normalized name for comparison
    const normalizedName = ingredient.name?.toLowerCase().trim() || "";
    if (!normalizedName) return;
    
    if (!mergedMap[normalizedName]) {
      // First occurrence of this ingredient
      mergedMap[normalizedName] = {
        ...ingredient,
        // Ensure these properties exist
        amount: ingredient.amount || 1,
        unit: ingredient.unit || "",
        category: categorizeItem(ingredient),
        uniqueId: ingredient.id ? `id-${ingredient.id}` : `name-${normalizedName}-${Date.now()}`
      };
    } else {
      // We already have this ingredient, merge quantities if possible
      const existing = mergedMap[normalizedName];
      
      // Only attempt to merge if units match
      if (existing.unit === ingredient.unit) {
        existing.amount += (ingredient.amount || 1);
      } else {
        // If units don't match, keep separate but note the mismatch
        const uniqueKey = `${normalizedName}-${ingredient.unit || 'unit'}-${Date.now()}`;
        mergedMap[uniqueKey] = {
          ...ingredient,
          amount: ingredient.amount || 1,
          unit: ingredient.unit || "",
          category: categorizeItem(ingredient),
          uniqueId: `id-${ingredient.id}-${Date.now()}`,
          note: `Different unit from ${existing.name} (${existing.amount} ${existing.unit})`
        };
      }
    }
  });
  
  return Object.values(mergedMap);
};

function ShoppingList() {
  const { shoppingList, removeFromShoppingList, clearShoppingList } = useRecipes();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  // Add transition effect when component mounts
  useEffect(() => {
    document.title = "Shopping List | Ordelo";
  }, []);

  // Memoize merged items to prevent unnecessary recalculations
  const mergedItems = useMemo(() => mergeIngredients(shoppingList), [shoppingList]);
  
  const filteredItems = useMemo(() => {
    return mergedItems.filter(item => 
      (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mergedItems, searchTerm]);
  
  // Group items by category
  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const category = item.category || FOOD_CATEGORIES.OTHER;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }, [filteredItems]);

  const handleCheckItem = useCallback((itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);

  const handleRemoveItem = useCallback((itemId) => {
    removeFromShoppingList(itemId);
  }, [removeFromShoppingList]);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.uniqueId));
    }
  }, [selectedItems.length, filteredItems]);

  const handleQuantityChange = useCallback((item, change) => {
    // This is a simplified version since we don't have updateShoppingListItem yet
    // We'll create a new item with updated amount and replace the old one
    const newAmount = Math.max(0, (item.amount || 1) + change);
    
    removeFromShoppingList(item.id);
    if (newAmount > 0) {
      const updatedItem = { ...item, amount: newAmount };
      // Re-add the item to the list with the new amount
      setTimeout(() => {
        // Use setTimeout to ensure the removal completes first
        const { addToShoppingList } = useRecipes();
        if (addToShoppingList) {
          addToShoppingList([updatedItem]);
        }
      }, 10);
    }
  }, [removeFromShoppingList]);

  return (
    <div className="shopping-list-page fade-in">
      <h1>
        <i className="fas fa-shopping-basket"></i> Your Shopping List
      </h1>
      <p>All the ingredients you need for your saved recipes.</p>

      <div className="shopping-list-controls">
        <div className="search-filter">
          <div className="search-input-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        <div className="list-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleSelectAll}
          >
            {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
          </button>
          
          <button 
            className="btn btn-accent"
            onClick={clearShoppingList}
          >
            <i className="fas fa-trash-alt"></i> Clear List
          </button>
        </div>
      </div>

      {shoppingList.length === 0 ? (
        <div className="empty-shopping-list">
          <div className="empty-state">
            <i className="fas fa-shopping-basket empty-icon"></i>
            <h2>Your Shopping List is Empty</h2>
            <p>
              Add ingredients to your shopping list by saving recipes.
            </p>
            <Link to="/" className="btn btn-primary">
              <i className="fas fa-search"></i> Find Recipes
            </Link>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="no-results">
          <i className="fas fa-search no-results-icon"></i>
          <h2>No Matching Ingredients</h2>
          <p>
            No ingredients match your search: "{searchTerm}". Try a different search term.
          </p>
          <button 
            className="btn btn-secondary" 
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="shopping-list-table-container">
          <table className="shopping-list-table">
            <thead>
              <tr>
                <th className="item-select-col"></th>
                <th className="item-image-col"></th>
                <th className="item-name-col">Item</th>
                <th className="item-quantity-col">Quantity</th>
                <th className="item-actions-col"></th>
              </tr>
            </thead>
            
            {Object.entries(groupedItems).map(([category, items]) => (
              <tbody key={`category-${category}`} className="category-group">
                <tr className="category-header">
                  <td colSpan="5">{category}</td>
                </tr>
                
                {items.map((item, itemIndex) => (
                  <tr 
                    key={item.uniqueId} 
                    className={`item-row ${itemIndex % 2 === 0 ? 'even' : 'odd'} ${selectedItems.includes(item.uniqueId) ? 'selected' : ''}`}
                  >
                    <td className="item-select-col">
                      <div className="item-checkbox">
                        <input 
                          type="checkbox" 
                          id={`item-${item.uniqueId}`}
                          checked={selectedItems.includes(item.uniqueId)}
                          onChange={() => handleCheckItem(item.uniqueId)}
                        />
                        <label htmlFor={`item-${item.uniqueId}`}></label>
                      </div>
                    </td>
                    
                    <td className="item-image-col">
                      <div className="item-image-container">
                        <img 
                          src={item.image ? `https://spoonacular.com/cdn/ingredients_100x100/${item.image}` : '/placeholder.jpg'} 
                          alt={item.name}
                          className="item-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder.jpg';
                          }}
                        />
                      </div>
                    </td>
                    
                    <td className="item-name-col">
                      <span className="item-name">{item.name}</span>
                      {item.note && <span className="item-note">{item.note}</span>}
                    </td>
                    
                    <td className="item-quantity-col">
                      <div className="quantity-control">
                        <button 
                          className="quantity-btn decrease"
                          onClick={() => handleQuantityChange(item, -1)}
                          disabled={item.amount <= 1}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        
                        <span className="quantity-display">
                          {item.amount ? item.amount.toFixed(item.amount % 1 === 0 ? 0 : 2) : 1} {item.unit || ''}
                        </span>
                        
                        <button 
                          className="quantity-btn increase"
                          onClick={() => handleQuantityChange(item, 1)}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </td>
                    
                    <td className="item-actions-col">
                      <button 
                        className="remove-item"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      )}
      
      {/* Shop Now section - new addition */}
      {shoppingList.length > 0 && (
        <div className="shop-now-container">
          <p>Ready to purchase these ingredients? Find the best stores near you!</p>
          <Link to="/shopping" className="btn btn-primary shop-now-btn">
            <i className="fas fa-store"></i> Shop Now
          </Link>
        </div>
      )}
    </div>
  );
}

export default ShoppingList;