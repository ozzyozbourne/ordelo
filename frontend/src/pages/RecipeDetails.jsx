import { useState, useEffect } from "react";
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
    addToShoppingList 
  } = useRecipes();
  
  const [recipe, setRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState("ingredients");

  useEffect(() => {
    const loadRecipeDetails = async () => {
      const data = await fetchRecipeById(id);
      if (data) {
        setRecipe(data);
      }
    };

    loadRecipeDetails();
  }, [id, fetchRecipeById]);

  const isRecipeSaved = () => {
    return savedRecipes.some(savedRecipe => savedRecipe.id === parseInt(id));
  };

  const handleAddToShoppingList = () => {
    if (recipe && recipe.extendedIngredients) {
      addToShoppingList(recipe.extendedIngredients);
    }
  };

  const renderNutrients = () => {
    if (!recipe.nutrition || !recipe.nutrition.nutrients) return null;
    
    const keyNutrients = [
      { name: "Calories", unit: "kcal" },
      { name: "Fat", unit: "g" },
      { name: "Carbohydrates", unit: "g" },
      { name: "Protein", unit: "g" },
      { name: "Fiber", unit: "g" },
      { name: "Sugar", unit: "g" },
    ];
    
    return keyNutrients.map(item => {
      const nutrient = recipe.nutrition.nutrients.find(
        n => n.name.toLowerCase() === item.name.toLowerCase()
      );
      
      if (!nutrient) return null;
      
      return (
        <div key={item.name} className="nutrient-item">
          <span className="nutrient-name">{item.name}</span>
          <div className="nutrient-bar-container">
            <div 
              className="nutrient-bar" 
              style={{ width: `${Math.min(100, (nutrient.amount / nutrient.percentOfDailyNeeds) * 100)}%` }}
            ></div>
          </div>
          <span className="nutrient-value">
            {Math.round(nutrient.amount)} {nutrient.unit}
          </span>
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="container loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading recipe details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container error-container">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
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
          
          <div className="recipe-meta-details">
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
          </div>
        </div>
      </div>

      <div className="container recipe-details-content">
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
              
              <ul className="ingredients-list">
                {recipe.extendedIngredients?.map((ingredient, index) => (
                  <li key={index} className="ingredient-item">
                    <div className="ingredient-image-container">
                      <img 
                        src={`https://spoonacular.com/cdn/ingredients_100x100/${ingredient.image}`} 
                        alt={ingredient.name}
                        className="ingredient-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/src/assets/ingredient-placeholder.jpg';
                        }}
                      />
                    </div>
                    <div className="ingredient-details">
                      <span className="ingredient-name">{ingredient.originalName}</span>
                      <span className="ingredient-amount">{ingredient.amount} {ingredient.unit}</span>
                    </div>
                    <button 
                      className="btn-icon add-to-list-btn"
                      onClick={() => addToShoppingList([ingredient])}
                      title="Add to shopping list"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="instructions-tab">
              <h2>Instructions</h2>
              
              {recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0 ? (
                <ol className="instructions-list">
                  {recipe.analyzedInstructions[0].steps.map(step => (
                    <li key={step.number} className="instruction-step">
                      <span className="step-number">{step.number}</span>
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
                    </li>
                  ))}
                </ol>
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
              
              <div className="nutrition-chart">
                {renderNutrients()}
              </div>
              
              <div className="nutrition-summary">
                <h3>Summary</h3>
                <p dangerouslySetInnerHTML={{ __html: recipe.summary }}></p>
              </div>
              
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