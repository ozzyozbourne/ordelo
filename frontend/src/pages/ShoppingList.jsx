// src/components/ShoppingList.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRecipes } from "../context/RecipeContext";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FOOD_CATEGORIES = {
  PRODUCE: "Produce",
  DAIRY: "Dairy",
  MEAT: "Meat & Seafood",
  PANTRY: "Pantry",
  CONDIMENTS: "Condiments & Spices",
  OTHER: "Other"
};

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

const mergeIngredients = (ingredients) => {
  const mergedMap = {};
  
  ingredients.forEach(ingredient => {
    if (!ingredient) return;
    
    const normalizedName = ingredient.name?.toLowerCase().trim() || "";
    if (!normalizedName) return;
    
    if (!mergedMap[normalizedName]) {
      mergedMap[normalizedName] = {
        ...ingredient,
        amount: ingredient.amount || 1,
        unit: ingredient.unit || "",
        category: categorizeItem(ingredient),
        uniqueId: ingredient.id ? `id-${ingredient.id}` : `name-${normalizedName}-${Date.now()}`
      };
    } else {
      const existing = mergedMap[normalizedName];
      
      if (existing.unit === ingredient.unit) {
        existing.amount += (ingredient.amount || 1);
      } else {
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
  const { shoppingList, removeFromShoppingList, clearShoppingList, addToShoppingList } = useRecipes();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Shopping List | Ordelo";
  }, []);

  const mergedItems = useMemo(() => mergeIngredients(shoppingList), [shoppingList]);
  
  const filteredItems = useMemo(() => {
    return mergedItems.filter(item => 
      (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mergedItems, searchTerm]);
  
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
    const newAmount = Math.max(0, (item.amount || 1) + change);
    removeFromShoppingList(item.id);
    addToShoppingList([{ ...item, amount: newAmount }]);
  }, [removeFromShoppingList, addToShoppingList]);

  const handleShopNow = async () => {
    if (selectedItems.length === 0) {
      setError("Please select at least one item to shop for");
      return;
    }

    if (!user?.token) {
      setError("Please log in to continue shopping");
      return;
    }

    try {
      const selectedIngredients = mergedItems
        .filter(item => selectedItems.includes(item.uniqueId))
        .map(item => {
          // Ensure amount is a valid number and convert to integer
          const amount = typeof item.amount === 'number' ? Math.round(item.amount) : 1;
          
          // Ensure unit is a string
          const unit = typeof item.unit === 'string' ? item.unit : '';
          
          // Ensure name is a string
          const name = typeof item.name === 'string' ? item.name : '';
          
          if (!name) {
            console.warn('Skipping item with no name:', item);
            return null;
          }

          return {
            name,
            unit_quantity: amount,
            unit
          };
        })
        .filter(Boolean); // Remove any null items

      if (selectedIngredients.length === 0) {
        setError("No valid ingredients selected");
        return;
      }

      const requestBody = {
        compare: selectedIngredients
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
        throw new Error("Failed to get store data");
      }

      // Parse the stringified JSON from data.ids
      const stores = JSON.parse(data.ids);
      console.log('Parsed stores:', stores); // Debug log
      
      // Navigate to shopping page with the store data
      navigate('/shopping', { state: { stores } });
    } catch (err) {
      console.error('Error in handleShopNow:', err);
      setError(err.message);
    }
  };

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
        <div className="shopping-list-container">
          {/* Two-Column Layout */}
          <div className="shopping-list-columns">
            <div className="shopping-column left-column">
              {/* Left Column Categories */}
              {Object.entries(groupedItems)
                .filter((_, index) => index % 2 === 0) // Even indices for left column
                .map(([category, items]) => (
                  <div className="category-group" key={`category-${category}`}>
                    <div className="category-header">{category}</div>
                    
                    {items.map((item) => (
                      <div 
                        key={item.uniqueId} 
                        className={`item-row ${selectedItems.includes(item.uniqueId) ? 'selected' : ''}`}
                      >
                        <div className="item-select-col">
                          <div className="item-checkbox">
                            <input 
                              type="checkbox" 
                              id={`item-${item.uniqueId}`}
                              checked={selectedItems.includes(item.uniqueId)}
                              onChange={() => handleCheckItem(item.uniqueId)}
                            />
                            <label htmlFor={`item-${item.uniqueId}`}></label>
                          </div>
                        </div>
                        
                        <div className="item-image-col">
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
                        </div>
                        
                        <div className="item-name-col">
                          <span className="item-name">{item.name}</span>
                          {item.note && <span className="item-note">{item.note}</span>}
                        </div>
                        
                        <div className="item-quantity-col">
                          <div className="quantity-control">
                            <span className="quantity-display">
                              {item.amount ? item.amount.toFixed(item.amount % 1 === 0 ? 0 : 2) : 1} {item.unit || ''}
                            </span>
                          </div>
                        </div>
                        
                        <div className="item-actions-col">
                          <button 
                            className="remove-item"
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
            
            <div className="shopping-column right-column">
              {/* Right Column Categories */}
              {Object.entries(groupedItems)
                .filter((_, index) => index % 2 === 1) // Odd indices for right column
                .map(([category, items]) => (
                  <div className="category-group" key={`category-${category}`}>
                    <div className="category-header">{category}</div>
                    
                    {items.map((item) => (
                      <div 
                        key={item.uniqueId} 
                        className={`item-row ${selectedItems.includes(item.uniqueId) ? 'selected' : ''}`}
                      >
                        <div className="item-select-col">
                          <div className="item-checkbox">
                            <input 
                              type="checkbox" 
                              id={`item-${item.uniqueId}`}
                              checked={selectedItems.includes(item.uniqueId)}
                              onChange={() => handleCheckItem(item.uniqueId)}
                            />
                            <label htmlFor={`item-${item.uniqueId}`}></label>
                          </div>
                        </div>
                        
                        <div className="item-image-col">
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
                        </div>
                        
                        <div className="item-name-col">
                          <span className="item-name">{item.name}</span>
                          {item.note && <span className="item-note">{item.note}</span>}
                        </div>
                        
                        <div className="item-quantity-col">
                          <div className="quantity-control">
                            
                            
                            <span className="quantity-display">
                              {item.amount ? item.amount.toFixed(item.amount % 1 === 0 ? 0 : 2) : 1} {item.unit || ''}
                            </span>
                          </div>
                        </div>
                        
                        <div className="item-actions-col">
                          <button 
                            className="remove-item"
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Shop Now section */}
      {shoppingList.length > 0 && (
        <div className="shop-now-container">
          <p>Ready to purchase these ingredients? Find the best stores near you!</p>
          <button 
            onClick={handleShopNow}
            className="btn btn-primary shop-now-btn"
            disabled={selectedItems.length === 0}
          >
            <i className="fas fa-store"></i> Shop Now
          </button>
        </div>
      )}
    </div>
  );
}

export default ShoppingList;