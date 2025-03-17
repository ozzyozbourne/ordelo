import { useState, useEffect } from "react";
import { useRecipes } from "../context/RecipeContext";
import { Link } from "react-router-dom";

function ShoppingList() {
  const { shoppingList, removeFromShoppingList, clearShoppingList } = useRecipes();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  // Add this useEffect for the page transition
  useEffect(() => {
    const container = document.querySelector('.shopping-list-page');
    if (container) {
      container.classList.add('page-transition');
      
      const timeout = setTimeout(() => {
        container.classList.remove('page-transition');
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, []);

  const filteredItems = shoppingList.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleRemoveItem = (itemId) => {
    removeFromShoppingList(itemId);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const handleRemoveSelected = () => {
    selectedItems.forEach(itemId => {
      removeFromShoppingList(itemId);
    });
    setSelectedItems([]);
  };

  // Group items by aisle
  const groupedItems = filteredItems.reduce((acc, item) => {
    const aisle = item.aisle || "Other";
    if (!acc[aisle]) {
      acc[aisle] = [];
    }
    acc[aisle].push(item);
    return acc;
  }, {});

  return (
    <div className="shopping-list-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">
            <i className="fas fa-shopping-basket"></i> Your Shopping List
          </h1>
          <p className="page-description">
            All the ingredients you need for your saved recipes.
          </p>
        </div>
      </div>

      <div className="container">
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
            {filteredItems.length > 0 && (
              <>
                <button 
                  className="btn btn-secondary"
                  onClick={handleSelectAll}
                >
                  {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
                </button>
                
                {selectedItems.length > 0 && (
                  <button 
                    className="btn btn-accent"
                    onClick={handleRemoveSelected}
                  >
                    <i className="fas fa-trash-alt"></i> Remove Selected
                  </button>
                )}
                
                <button 
                  className="btn btn-accent"
                  onClick={clearShoppingList}
                >
                  <i className="fas fa-trash-alt"></i> Clear List
                </button>
              </>
            )}
          </div>
        </div>

        {shoppingList.length === 0 ? (
          <div className="empty-shopping-list">
            <div className="empty-state">
              <i className="fas fa-shopping-basket empty-icon"></i>
              <h2>Your Shopping List is Empty</h2>
              <p>
                Add ingredients to your shopping list by saving recipes or adding them manually.
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
          <div className="shopping-list-content">
            {Object.entries(groupedItems).map(([aisle, items]) => (
              <div key={aisle} className="shopping-list-section">
                <h2 className="aisle-title">{aisle}</h2>
                <ul className="shopping-items">
                  {items.map(item => (
                    <li 
                      key={item.id} 
                      className={`shopping-item ${selectedItems.includes(item.id) ? 'selected' : ''}`}
                    >
                      <div className="item-checkbox">
                        <input 
                          type="checkbox" 
                          id={`item-${item.id}`}
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleCheckItem(item.id)}
                        />
                        <label htmlFor={`item-${item.id}`}></label>
                      </div>
                      
                      <div className="item-content">
                        <span className="item-name">
                          {item.name}
                        </span>
                        {item.amount && item.unit && (
                          <span className="item-quantity">
                            {item.amount} {item.unit}
                          </span>
                        )}
                      </div>
                      
                      <button 
                        className="remove-item"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShoppingList;