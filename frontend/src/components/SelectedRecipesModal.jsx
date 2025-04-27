// src/components/SelectedRecipesModal.jsx

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRecipes } from "../context/RecipeContext";

function SelectedRecipesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedRecipes, removeFromSelected, clearSelectedRecipes, addToShoppingList } = useRecipes();
  const [recipeServings, setRecipeServings] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const showOnPages = ['/', '/saved-recipes', `/recipe/${location.pathname.split('/')[2]}`];
  const shouldShow = location.pathname.startsWith('/recipe/') || showOnPages.includes(location.pathname);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const initialServings = {};
    selectedRecipes.forEach(recipe => {
      initialServings[recipe.id] = recipe.servings || 1; // default serving is 1 if missing
    });
    setRecipeServings(initialServings);
  }, [selectedRecipes]);

  const handleIncreaseServing = (recipeId) => {
    setRecipeServings(prev => ({
      ...prev,
      [recipeId]: prev[recipeId] + 1
    }));
  };

  const handleDecreaseServing = (recipeId) => {
    setRecipeServings(prev => ({
      ...prev,
      [recipeId]: Math.max(1, prev[recipeId] - 1)
    }));
  };

  const mergeIngredients = (ingredients) => {
    const merged = {};

    ingredients.forEach(ingredient => {
      const key = `${ingredient.name?.toLowerCase() || ''}-${ingredient.unit || ''}`;

      if (!merged[key]) {
        merged[key] = { ...ingredient };
      } else {
        merged[key].amount += ingredient.amount;
      }
    });

    return Object.values(merged);
  };

  const handleGenerateShoppingList = () => {
    const adjustedIngredients = selectedRecipes.flatMap(recipe => {
      const multiplier = recipeServings[recipe.id] || 1;
      return (recipe.extendedIngredients || []).map(ing => ({
        id: ing.id,
        name: ing.name,
        amount: (ing.measures?.metric?.amount || 1) * multiplier,
        unit: ing.measures?.metric?.unitShort || ing.unit || '',
        image: ing.image || ''
      }));
    });

    const mergedIngredients = mergeIngredients(adjustedIngredients);

    addToShoppingList(mergedIngredients);
    setIsOpen(false);
    navigate('/shopping-list');
  };

  if (!shouldShow) return null;

  return (
    <>
      <button 
        className={`selected-recipes-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Selected recipes"
      >
        <i className="fas fa-shopping-basket"></i>
        <span className="selected-count">{selectedRecipes.length}</span>
      </button>

      {isOpen && selectedRecipes.length > 0 && (
        <div className="modal-overlay selected-recipes-overlay">
          <div className="selected-recipes-modal">
            <div className="modal-header">
              <h3 className="modal-header-text">Selected Recipes ({selectedRecipes.length})</h3>
              <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close">
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
                    <div className="servings-control">
                      <button onClick={() => handleDecreaseServing(recipe.id)} className="serving-btn">-</button>
                      <span className="serving-count">{recipeServings[recipe.id]}x</span>
                      <button onClick={() => handleIncreaseServing(recipe.id)} className="serving-btn">+</button>
                    </div>
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
              <button className="btn btn-secondary" onClick={clearSelectedRecipes}>
                Clear All
              </button>
              <button className="btn btn-primary" onClick={handleGenerateShoppingList}>
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
