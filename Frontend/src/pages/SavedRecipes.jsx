import { useState } from "react";
import { useRecipes } from "../context/RecipeContext";
import RecipeCard from "../components/RecipeCard";
import { Link } from "react-router-dom";

function SavedRecipes() {
  const { savedRecipes, toggleSaveRecipe } = useRecipes();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecipes = savedRecipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="saved-recipes-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">
            <i className="fas fa-heart"></i> Your Saved Recipes
          </h1>
          <p className="page-description">
            All your favorite recipes in one place for quick access.
          </p>
        </div>
      </div>

      <div className="container">
        <div className="saved-recipes-controls">
          <div className="search-filter">
            <div className="search-input-container">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search your saved recipes..."
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
        </div>

        {savedRecipes.length === 0 ? (
          <div className="no-saved-recipes">
            <div className="empty-state">
              <i className="far fa-heart empty-icon"></i>
              <h2>No Saved Recipes Yet</h2>
              <p>
                You haven't saved any recipes yet. Browse recipes and save your favorites!
              </p>
              <Link to="/" className="btn btn-primary">
                <i className="fas fa-search"></i> Find Recipes
              </Link>
            </div>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="no-results">
            <i className="fas fa-search no-results-icon"></i>
            <h2>No Matching Recipes</h2>
            <p>
              No saved recipes match your search: "{searchTerm}". Try a different search term.
            </p>
            <button 
              className="btn btn-secondary" 
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="recipes-grid">
            {filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSave={toggleSaveRecipe}
                isSaved={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedRecipes;