// src/components/SelectedRecipesModal.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRecipes } from "../context/RecipeContext";

function SelectedRecipesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedRecipes, removeFromSelected, clearSelectedRecipes, addToShoppingList } = useRecipes();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add this to only show on home and saved recipes pages
  const showOnPages = ['/', '/saved-recipes'];
  const shouldShow = showOnPages.includes(location.pathname);
  
  // Log AFTER variables are defined
  console.log("SelectedRecipesModal rendering", { 
    selectedRecipes, 
    currentPath: location.pathname,
    shouldShow 
  });
  
  // Close modal if user clicks outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleGenerateShoppingList = () => {
    // Extract all ingredients from selected recipes
    const allIngredients = selectedRecipes.flatMap(recipe => 
      recipe.extendedIngredients || []
    );
    
    // Add ingredients to shopping list
    addToShoppingList(allIngredients);
    
    // Close modal
    setIsOpen(false);
    
    // Redirect to shopping list page with animation
    navigate('/shopping-list');
  };
  
  // If not on a page where we should show, return null
  if (!shouldShow) {
    return null;
  }
  
  return (
    <>
      {/* Floating button to open modal - always visible */}
      <button 
        className={`selected-recipes-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Selected recipes"
      >
        <i className="fas fa-shopping-basket"></i>
        <span className="selected-count">{selectedRecipes.length}</span>
      </button>
      
      {/* Modal - only visible when open AND there are selected recipes */}
      {isOpen && selectedRecipes.length > 0 && (
        <div className="modal-overlay selected-recipes-overlay">
          <div className="selected-recipes-modal">
            <div className="modal-header">
              <h3>Selected Recipes ({selectedRecipes.length})</h3>
              <button 
                className="close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="selected-recipes-list">
              {selectedRecipes.map(recipe => (
                <div key={recipe.id} className="selected-recipe-item">
                  <img 
                    src={recipe.image || '/src/assets/placeholder-food.jpg'}
                    alt={recipe.title}
                    className="selected-recipe-img"
                  />
                  <div className="selected-recipe-details">
                    <h4>{recipe.title}</h4>
                    <span>{recipe.readyInMinutes || '30'} min</span>
                  </div>
                  <button 
                    className="remove-selected-btn"
                    onClick={() => removeFromSelected(recipe.id)}
                    aria-label={`Remove ${recipe.title}`}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={clearSelectedRecipes}
              >
                Clear All
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleGenerateShoppingList}
              >
                <i className="fas fa-shopping-basket"></i> Generate Shopping List
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SelectedRecipesModal;