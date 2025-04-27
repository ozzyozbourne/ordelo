// src/pages/Home.jsx

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import RecipeCard from "../components/RecipeCard";
import { useRecipes } from "../context/RecipeContext";

function Home() {
  const { 
    recipes, 
    isLoading, 
    error, 
    savedRecipes,
    searchRecipes, 
    fetchRandomRecipes,
    filterRecipesByCuisine,
    toggleSaveRecipe
  } = useRecipes();
  
  const [activeCuisine, setActiveCuisine] = useState("all");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const resultsRef = useRef(null);

  const [visibleRecipes, setVisibleRecipes] = useState(12); // NEW state for Load More
  
  const [searchSuggestions] = useState([
    "Pasta", "Pizza", "Curry", "Salad", "Smoothie", 
    "Chicken", "Vegetarian", "Soup", "Dessert", "Breakfast"
  ]);

  const handleSearch = (query) => {
    searchRecipes(query);
    setHasSearched(true);
    setSearchQuery(query);
    setActiveCuisine("all");
    setVisibleRecipes(12); // Reset visible count on new search
    
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  };

  const handleCuisineClick = (cuisine) => {
    setActiveCuisine(cuisine);
    setHasSearched(false);
    setVisibleRecipes(12); // Reset visible count
    
    if (cuisine === "all") {
      fetchRandomRecipes();
    } else {
      filterRecipesByCuisine(cuisine);
    }
  };

  const clearSearch = () => {
    setHasSearched(false);
    setSearchQuery("");
    setVisibleRecipes(12);
  };

  const isRecipeSaved = (id) => {
    return savedRecipes.some(recipe => recipe.id === id);
  };

  useEffect(() => {
    if (recipes.length === 0) {
      fetchRandomRecipes();
    }
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <h1>Cook Smarter, Shop Faster, Eat Better</h1>
          <p>Explore endless recipes, build your shopping list instantly, and save on every order.</p>
          
          <SearchBar onSearch={handleSearch} suggestions={searchSuggestions} />
          
          <div className="hero-buttons">
            <Link to="/add-recipe" className="btn btn-primary">
              <i className="fas fa-plus-circle"></i> Add Your Recipe
            </Link>
            <Link to="/saved-recipes" className="btn btn-secondary">
              <i className="fas fa-heart"></i> Saved Recipes
            </Link>
          </div>
        </div>
      </section>

      {/* Search Results (conditionally rendered) */}
      {hasSearched && (
        <section className="section search-results-section" ref={resultsRef}>
          <div className="container">
            <div className="search-results-header">
              <h2 className="section-title">
                Search Results for "{searchQuery}"
              </h2>
              <button className="clear-search-btn" onClick={clearSearch}>
                <i className="fas fa-times"></i> Clear Search
              </button>
            </div>
            
            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            
            {isLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Finding delicious recipes...</p>
              </div>
            ) : recipes.length > 0 ? (
              <>
                <div className="recipes-grid">
                  {recipes.slice(0, visibleRecipes).map(recipe => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      onSave={toggleSaveRecipe}
                      isSaved={isRecipeSaved(recipe.id)}
                    />
                  ))}
                </div>

                {visibleRecipes < recipes.length && (
                  <div className="load-more-container">
                    <button className="btn btn-secondary" onClick={() => setVisibleRecipes(prev => prev + 12)}>
                      Load More
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-recipes">
                <i className="fas fa-search"></i>
                <p>No recipes found for "{searchQuery}". Try a different search term.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className={`main-content ${hasSearched ? 'blurred-background' : ''}`}>
        {/* Cuisine Categories */}
        <section className="section">
          <div className="container">
            <h2 className="section-title">Explore Cuisines</h2>
            
            <div className="cuisine-categories">
              {["all", "italian", "indian", "mediterranean", "mexican", "asian"].map((cuisine) => (
                <button
                  key={cuisine}
                  className={`cuisine-category ${activeCuisine === cuisine ? "active" : ""}`}
                  onClick={() => handleCuisineClick(cuisine)}
                >
                  {cuisine === "all" ? "All Cuisines" : (
                    <>
                      {cuisine === "italian" && <i className="fas fa-pizza-slice"></i>}
                      {cuisine === "indian" && <i className="fas fa-pepper-hot"></i>}
                      {cuisine === "mediterranean" && <i className="fas fa-fish"></i>}
                      {cuisine === "mexican" && <i className="fas fa-drumstick-bite"></i>}
                      {cuisine === "asian" && <i className="fas fa-utensils"></i>}
                      {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Recipes for selected Cuisine */}
        <section className="section">
          <div className="container">
            <h2 className="section-title">
              {activeCuisine === "all" ? "Hot Picks For You" : `${activeCuisine.charAt(0).toUpperCase() + activeCuisine.slice(1)} Recipes`}
            </h2>
            
            {error && !hasSearched && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            
            {isLoading && !hasSearched ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Finding delicious recipes...</p>
              </div>
            ) : recipes.length > 0 && !hasSearched ? (
              <>
                <div className="recipes-grid">
                  {recipes.slice(0, visibleRecipes).map(recipe => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      onSave={toggleSaveRecipe}
                      isSaved={isRecipeSaved(recipe.id)}
                    />
                  ))}
                </div>

                {visibleRecipes < recipes.length && (
                  <div className="load-more-container">
                    <button className="btn btn-secondary" onClick={() => setVisibleRecipes(prev => prev + 12)}>
                      Load More
                    </button>
                  </div>
                )}
              </>
            ) : !hasSearched && (
              <div className="no-recipes">
                <i className="fas fa-utensils"></i>
                <p>No recipes found. Try a different cuisine.</p>
              </div>
            )}
          </div>
        </section>

        {/* Browse Ingredients */}
        <section className="section ingredients-section">
          <div className="container">
            <h2 className="section-title">Browse by Ingredients</h2>
            <div className="ingredients-grid">
              {[
                { name: "chicken", img: "/src/assets/ingredients/chicken.png" },
                { name: "vegetables", img: "/src/assets/ingredients/vegetable.png" },
                { name: "seafood", img: "/src/assets/ingredients/seafood.png" },
                { name: "beef", img: "/src/assets/ingredients/beef.png" },
              ].map(({ name, img }) => (
                <div key={name} className="ingredient-card" onClick={() => handleSearch(name)}>
                  <div className="ingredient-img-container">
                    <img src={img} alt={name} className="ingredient-img" />
                  </div>
                  <h3>{name.charAt(0).toUpperCase() + name.slice(1)}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default Home;
