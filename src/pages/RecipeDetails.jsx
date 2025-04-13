import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecipes } from "../context/RecipeContext";


function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    fetchRecipeById, 
    isLoading, 
    error, 
    savedRecipes,
    toggleSaveRecipe,
    addToShoppingList,
    addToSelectedRecipes
  } = useRecipes();
  
  const [recipe, setRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState("ingredients");

  // Use useCallback to prevent unnecessary function recreations
  const loadRecipeDetails = useCallback(async () => {
    try {
      const data = await fetchRecipeById(id);
      if (data) {
        setRecipe(data);
      }
    } catch (err) {
      console.error("Error loading recipe:", err);
    }
  }, [id, fetchRecipeById]);

  useEffect(() => {
    loadRecipeDetails();
  }, [loadRecipeDetails]);

  const isRecipeSaved = useCallback(() => {
    return savedRecipes.some(savedRecipe => savedRecipe.id === parseInt(id));
  }, [savedRecipes, id]);

  const handleAddToShoppingList = useCallback(() => {
    if (recipe && recipe.extendedIngredients) {
      addToShoppingList(recipe.extendedIngredients);
    }
  }, [recipe, addToShoppingList]);

  const handleAddToMealPlan = useCallback(() => {
    if (recipe) {
      addToSelectedRecipes(recipe);
    }
  }, [recipe, addToSelectedRecipes]);

  if (isLoading) {
    return (
      <div className="recipe-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading recipe details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipe-details-error">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
          <button className="btn-primary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="recipe-details-page">
      <div className="recipe-hero" style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${recipe.image})` 
      }}>
        <div className="container">
          <button className="back-button" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>{recipe.title}</h1>
          
          <div className="recipe-meta">
            <div className="recipe-meta-item">
              <i className="far fa-clock"></i>
              <span>{recipe.readyInMinutes} min</span>
            </div>
            <div className="recipe-meta-item">
              <i className="fas fa-utensils"></i>
              <span>{recipe.servings} servings</span>
            </div>
            {recipe.vegetarian && (
              <div className="recipe-meta-item">
                <i className="fas fa-leaf"></i>
                <span>Vegetarian</span>
              </div>
            )}
            {recipe.glutenFree && (
              <div className="recipe-meta-item">
                <i className="fas fa-bread-slice"></i>
                <span>Gluten Free</span>
              </div>
            )}
          </div>
          
          <div className="recipe-actions">
            <button 
              className={`btn ${isRecipeSaved() ? 'btn-accent' : 'btn-primary'}`}
              onClick={() => toggleSaveRecipe(recipe)}
            >
              <i className={`${isRecipeSaved() ? 'fas' : 'far'} fa-heart`}></i>
              {isRecipeSaved() ? ' Saved' : ' Save Recipe'}
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={handleAddToShoppingList}
            >
              <i className="fas fa-shopping-basket"></i> Add to Shopping List
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={handleAddToMealPlan}
            >
              <i className="fas fa-list"></i> Add to Meal Plan
            </button>
          </div>
        </div>
      </div>

      <div className="container recipe-content">
        <div className="recipe-tabs">
          <button 
            className={`tab-button ${activeTab === 'ingredients' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredients')}
          >
            <i className="fas fa-list"></i> Ingredients
          </button>
          <button 
            className={`tab-button ${activeTab === 'instructions' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructions')}
          >
            <i className="fas fa-tasks"></i> Instructions
          </button>
          <button 
            className={`tab-button ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('nutrition')}
          >
            <i className="fas fa-chart-pie"></i> Nutrition
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'ingredients' && (
            <div className="ingredients-tab">
              <h2>Ingredients</h2>
              <p className="servings-text">For {recipe.servings} servings</p>
              
              <div className="ingredients-grid">
                {recipe.extendedIngredients?.map((ingredient, index) => (
                  <div key={index} className="ingredient-card">
                    <div className="ingredient-image">
                      <img 
                        src={`https://spoonacular.com/cdn/ingredients_100x100/${ingredient.image}`} 
                        alt={ingredient.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder.jpg';
                        }}
                      />
                    </div>
                    <div className="ingredient-info">
                      <p className="ingredient-name">{ingredient.originalName}</p>
                      <p className="ingredient-amount">{ingredient.amount} {ingredient.unit}</p>
                    </div>
                    <button 
                      className="add-ingredient-btn"
                      onClick={() => addToShoppingList([ingredient])}
                      title="Add to shopping list"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="instructions-tab">
              <h2>Instructions</h2>
              
              {recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0 ? (
                <div className="instructions-list">
                  {recipe.analyzedInstructions[0].steps.map(step => (
                    <div key={step.number} className="instruction-step">
                      <div className="step-number">{step.number}</div>
                      <div className="step-content">
                        <p>{step.step}</p>
                        {step.ingredients && step.ingredients.length > 0 && (
                          <div className="step-ingredients">
                            <span>Ingredients used:</span>
                            <div className="used-ingredients">
                              {step.ingredients.map(ingredient => (
                                <span key={ingredient.id} className="used-ingredient">
                                  {ingredient.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="instructions-text">
                  {recipe.instructions ? (
                    <p dangerouslySetInnerHTML={{ __html: recipe.instructions }}></p>
                  ) : (
                    <p className="no-instructions">No instructions available for this recipe.</p>
                  )}
                </div>
              )}
              
              {recipe.sourceUrl && (
                <div className="source-link">
                  <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                    <i className="fas fa-external-link-alt"></i> View Original Recipe
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="nutrition-tab">
              <h2>Nutrition Information</h2>
              <p className="nutrition-per-serving">Per serving</p>
              
              {recipe.nutrition && recipe.nutrition.nutrients && (
                <div className="nutrition-grid">
                  {recipe.nutrition.nutrients
                    .filter(nutrient => 
                      ['Calories', 'Fat', 'Carbohydrates', 'Protein', 'Fiber', 'Sugar'].includes(nutrient.name))
                    .map(nutrient => (
                      <div key={nutrient.name} className="nutrition-item">
                        <div className="nutrient-name">{nutrient.name}</div>
                        <div className="nutrient-bar-container">
                          <div 
                            className="nutrient-bar" 
                            style={{ width: `${Math.min(100, nutrient.percentOfDailyNeeds)}%` }}
                          ></div>
                        </div>
                        <div className="nutrient-value">
                          {Math.round(nutrient.amount)} {nutrient.unit}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
              
              {recipe.diets && recipe.diets.length > 0 && (
                <div className="diet-tags">
                  <h3>Dietary Information</h3>
                  <div className="tags">
                    {recipe.diets.map(diet => (
                      <span key={diet} className="diet-tag">{diet}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeDetails;