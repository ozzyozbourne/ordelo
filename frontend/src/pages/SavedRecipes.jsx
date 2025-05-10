import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRecipes } from "../context/RecipeContext";
import "../styles/SavedRecipes.css";

function SavedRecipes() {
  const { user } = useAuth();
  const { addToShoppingList, selectedRecipes, addToSelectedRecipes, removeFromSelected } = useRecipes();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  const fetchSavedRecipes = async () => {
    try {
      const token = user?.token;

      if (!token) throw new Error("You are not logged in.");

      const response = await fetch("http://localhost:8080/user/recipes", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch recipes.");

      const data = await response.json();

      // Normalize ingredient_id (fix $oid issue)
      const parsedRecipes = data.value.map(recipe => ({
        ...recipe,
        items: recipe.items.map(item => ({
          ...item,
          ingredient_id: item.ingredient_id?.$oid || item.ingredient_id
        }))
      }));

      setRecipes(parsedRecipes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipeSelection = (recipe) => {
    if (selectedRecipes.some(r => r.recipe_id === recipe.recipe_id)) {
      removeFromSelected(recipe.recipe_id);
    } else {
      addToSelectedRecipes(recipe);
    }
  };

  if (loading) return (
    <div className="saved-recipes-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading your recipes...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="saved-recipes-container">
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i> {error}
      </div>
    </div>
  );

  return (
    <div className="saved-recipes-container">
      <div className="saved-recipes-header">
        <h1 className="saved-recipes-title">
          <i className="fas fa-bookmark"></i> Your Saved Recipes
        </h1>
        <div className="saved-recipes-actions">
          <Link to="/add-recipe" className="saved-recipe-btn primary">
            <i className="fas fa-plus"></i> Add New Recipe
          </Link>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="empty-saved-recipes">
          <i className="fas fa-book empty-icon"></i>
          <h3>No Saved Recipes Yet</h3>
          <p>Start saving recipes to your collection or create your own recipes.</p>
          <Link to="/" className="saved-recipe-btn primary">
            <i className="fas fa-search"></i> Browse Recipes
          </Link>
        </div>
      ) : (
        <div className="saved-recipes-grid">
          {recipes.map((recipe) => (
            <div
              key={recipe.recipe_id}
              className={`saved-recipe-card ${
                selectedRecipes.some(r => r.recipe_id === recipe.recipe_id) ? 'selected' : ''
              }`}
            >
              <div className="saved-recipe-content">
                <h3 className="saved-recipe-title">{recipe.title}</h3>
                
                <div className="saved-recipe-meta">
                  <span>
                    <i className="far fa-clock"></i> {recipe.preparation_time} min
                  </span>
                  <span>
                    <i className="fas fa-utensils"></i> {recipe.serving_size} servings
                  </span>
                </div>
                
                <p className="saved-recipe-description">{recipe.description}</p>
                
                <div className="saved-recipe-ingredients">
                  <h4>Ingredients:</h4>
                  <ul className="selected-selected-ingredients-list">
                    {recipe.items.map((item, index) => (
                      <li key={index} className="ingredient-item">
                        <span className="ingredient-quantity">{item.quantity} {item.unit}</span>
                        <span className="ingredient-name">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="saved-recipe-actions">
                  <button
                    className={`saved-recipe-btn ${
                      selectedRecipes.some(r => r.recipe_id === recipe.recipe_id) ? 'primary' : 'secondary'
                    }`}
                    onClick={() => toggleRecipeSelection(recipe)}
                  >
                    {selectedRecipes.some(r => r.recipe_id === recipe.recipe_id) ? (
                      <>
                        <i className="fas fa-check-circle"></i> Selected
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus-circle"></i> Select
                      </>
                    )}
                  </button>
                  
                  <button
                    className="saved-recipe-btn danger"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this recipe?")) {
                        // Delete recipe functionality here
                        console.log("Delete recipe:", recipe.recipe_id);
                      }
                    }}
                  >
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedRecipes;