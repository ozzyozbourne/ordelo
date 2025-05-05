import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecipes } from "../context/RecipeContext";

function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchRecipeById, addToSelectedRecipes, selectedRecipes } = useRecipes();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isSelected = selectedRecipes.some(sel => sel.id === Number(id));

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        let data = await fetchRecipeById(id);
        if (data && (!data.extendedIngredients?.length || !data.analyzedInstructions?.length)) {
          console.log("Partial recipe detected. Refetching full details...");
          data = await fetchRecipeById(id);
        }
        if (data) {
          setRecipe(data);
        } else {
          setError("Recipe not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load recipe.");
      } finally {
        setLoading(false);
      }
    };
    loadRecipe();
  }, [id, fetchRecipeById]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading Recipe...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="recipe-details-page container">
      {/* Small header */}
      <div className="page-header-small">
        <h1 className="page-title">{recipe.title}</h1>
        <button className="back-button-small btn btn-secondary" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
      </div>

      {/* Main Layout */}
      <div className="recipe-layout">
        {/* Left side - Content */}
        <div className="recipe-content-card">
          <div className="recipe-actions" style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
            <button 
              className={`btn ${isSelected ? "btn-accent" : "btn-secondary"}`} 
              onClick={() => addToSelectedRecipes(recipe)}
            >
              <i className="fas fa-shopping-basket"></i> {isSelected ? "Selected" : "Select"}
            </button>
          </div>

          <div className="recipe-meta">
            <div className="recipe-meta-item"><i className="far fa-clock"></i> {recipe.readyInMinutes} min</div>
            <div className="recipe-meta-item"><i className="fas fa-fire"></i> {recipe.nutrition?.nutrients?.[0]?.amount || "?"} cal</div>
            <div className="recipe-meta-item"><i className="fas fa-utensils"></i> {recipe.servings} servings</div>
          </div>

          {/* Ingredients */}
          <section className="ingredients-tab">
            <h2 className="section-title">Ingredients</h2>
            <ul className="ingredients-list">
              {recipe.extendedIngredients.map((ing, idx) => (
                <li key={idx}>{ing.original}</li>
              ))}
            </ul>
          </section>

          {/* Instructions */}
          <section className="instructions-tab">
            <h2 className="section-title">Instructions</h2>
            {recipe.analyzedInstructions?.length ? (
              <ol className="instructions-list">
                {recipe.analyzedInstructions[0].steps.map((step, idx) => (
                  <li key={idx}>{step.step}</li>
                ))}
              </ol>
            ) : (
              <p>No instructions available.</p>
            )}
          </section>
        </div>

        {/* Right side - Image */}
        <div className="recipe-image-container">
          <img 
            src={recipe.image || '/src/assets/placeholder-food.jpg'}
            alt={recipe.title}
            className="recipe-details-image"
          />
        </div>
      </div>
    </div>
  );
}

export default RecipeDetails;
