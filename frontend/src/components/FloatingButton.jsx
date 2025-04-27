// FloatingButton.jsx - Complete code with CSS classes
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRecipes } from "../context/RecipeContext";

function FloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedRecipes, removeFromSelected, clearSelectedRecipes, addToShoppingList } = useRecipes();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Only show on home and saved recipes pages
  if (location.pathname !== '/' && location.pathname !== '/saved-recipes') {
    return null;
  }
  
  const handleGenerateShoppingList = () => {
    const allIngredients = selectedRecipes.flatMap(recipe => 
      recipe.extendedIngredients || []
    );
    addToShoppingList(allIngredients);
    setIsOpen(false);
    navigate('/shopping-list');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="floating-action-btn"
      >
        <i className="fas fa-shopping-basket"></i>
        {selectedRecipes.length > 0 && (
          <span className="badge">
            {selectedRecipes.length}
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="modal-container">
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="modal-header-text">Selected Recipes ({selectedRecipes.length})</h3>
              <button 
                className="close-btn"
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="modal-content">
              {selectedRecipes.length > 0 ? (
                selectedRecipes.map(recipe => (
                  <div key={recipe.id} className="recipe-item">
                    <img 
                      src={recipe.image || '/src/assets/placeholder-food.jpg'}
                      alt={recipe.title}
                      className="recipe-item-image"
                    />
                    <div className="recipe-item-details">
                      <h4>{recipe.title}</h4>
                      <span>{recipe.readyInMinutes || '30'} min</span>
                    </div>
                    <button 
                      className="remove-item-btn"
                      onClick={() => removeFromSelected(recipe.id)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <i className="fas fa-shopping-basket empty-icon"></i>
                  <p>No recipes selected yet.</p>
                  <p>Select recipes to generate a shopping list.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              {selectedRecipes.length > 0 ? (
                <>
                  <button 
                    onClick={clearSelectedRecipes}
                    className="btn btn-secondary"
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={handleGenerateShoppingList}
                    className="btn btn-primary"
                  >
                    <i className="fas fa-shopping-basket"></i> Generate Shopping List
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/');
                  }}
                  className="btn btn-primary"
                >
                  <i className="fas fa-search"></i> Browse Recipes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingButton;