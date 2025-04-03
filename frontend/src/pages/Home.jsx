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
  
  const [searchSuggestions] = useState([
    "Pasta", "Pizza", "Curry", "Salad", "Smoothie", 
    "Chicken", "Vegetarian", "Soup", "Dessert", "Breakfast"
  ]);

  const handleSearch = (query) => {
    searchRecipes(query);
    setHasSearched(true);
    setSearchQuery(query);
    setActiveCuisine("all");
    
    // Scroll to results after search
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  };

  const handleCuisineClick = (cuisine) => {
    setActiveCuisine(cuisine);
    setHasSearched(false);
    
    if (cuisine === "all") {
      fetchRandomRecipes();
    } else {
      filterRecipesByCuisine(cuisine);
    }
  };

  const clearSearch = () => {
    setHasSearched(false);
    setSearchQuery("");
  };

  const isRecipeSaved = (id) => {
    return savedRecipes.some(recipe => recipe.id === id);
  };

  useEffect(() => {
    // Fetch initial random recipes when component mounts
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
              <div className="recipes-grid">
                {recipes.map(recipe => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    onSave={toggleSaveRecipe}
                    isSaved={isRecipeSaved(recipe.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="no-recipes">
                <i className="fas fa-search"></i>
                <p>No recipes found for "{searchQuery}". Try a different search term.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Content (blurred when search results are showing) */}
      <div className={`main-content ${hasSearched ? 'blurred-background' : ''}`}>
        {/* Cuisine Categories */}
        <section className="section">
          <div className="container">
            <h2 className="section-title">Explore Cuisines</h2>
            
            <div className="cuisine-categories">
              <button 
                className={`cuisine-category ${activeCuisine === "all" ? "active" : ""}`}
                onClick={() => handleCuisineClick("all")}
              >
                All Cuisines
              </button>
              <button 
                className={`cuisine-category ${activeCuisine === "italian" ? "active" : ""}`}
                onClick={() => handleCuisineClick("italian")}
                id="cuisine-italian"
              >
                <i className="fas fa-pizza-slice"></i> Italian
              </button>
              <button 
                className={`cuisine-category ${activeCuisine === "indian" ? "active" : ""}`}
                onClick={() => handleCuisineClick("indian")}
                id="cuisine-indian"
              >
                <i className="fas fa-pepper-hot"></i> Indian
              </button>
              <button 
                className={`cuisine-category ${activeCuisine === "mediterranean" ? "active" : ""}`}
                onClick={() => handleCuisineClick("mediterranean")}
                id="cuisine-mediterranean"
              >
                <i className="fas fa-fish"></i> Mediterranean
              </button>
              <button 
                className={`cuisine-category ${activeCuisine === "mexican" ? "active" : ""}`}
                onClick={() => handleCuisineClick("mexican")}
                id="cuisine-mexican"
              >
                <i className="fas fa-drumstick-bite"></i> Mexican
              </button>
              <button 
                className={`cuisine-category ${activeCuisine === "asian" ? "active" : ""}`}
                onClick={() => handleCuisineClick("asian")}
                id="cuisine-asian"
              >
                <i className="fas fa-utensils"></i> Asian
              </button>
            </div>
          </div>
        </section>

        {/* Recipe Results for Selected Cuisine */}
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
              <div className="recipes-grid">
                {recipes.map(recipe => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    onSave={toggleSaveRecipe}
                    isSaved={isRecipeSaved(recipe.id)}
                  />
                ))}
              </div>
            ) : !hasSearched && (
              <div className="no-recipes">
                <i className="fas fa-utensils"></i>
                <p>No recipes found. Try a different cuisine.</p>
              </div>
            )}
          </div>
        </section>

        {/* Most Popular Ingredients Section */}
        <section className="section ingredients-section">
          <div className="container">
            <h2 className="section-title">Browse by Ingredients</h2>
            
            <div className="ingredients-grid">
              <div className="ingredient-card" onClick={() => handleSearch("chicken")}>
                <div className="ingredient-img-container">
                  <img src="/src/assets/ingredients/chicken.jpg" alt="Chicken" className="ingredient-img" />
                </div>
                <h3>Chicken</h3>
              </div>
              
              <div className="ingredient-card" onClick={() => handleSearch("pasta")}>
                <div className="ingredient-img-container">
                  <img src="/src/assets/ingredients/pasta.jpg" alt="Pasta" className="ingredient-img" />
                </div>
                <h3>Pasta</h3>
              </div>
              
              <div className="ingredient-card" onClick={() => handleSearch("vegetables")}>
                <div className="ingredient-img-container">
                  <img src="/src/assets/ingredients/vegetables.jpg" alt="Vegetables" className="ingredient-img" />
                </div>
                <h3>Vegetables</h3>
              </div>
              
              <div className="ingredient-card" onClick={() => handleSearch("seafood")}>
                <div className="ingredient-img-container">
                  <img src="/src/assets/ingredients/seafood.jpg" alt="Seafood" className="ingredient-img" />
                </div>
                <h3>Seafood</h3>
              </div>
              
              <div className="ingredient-card" onClick={() => handleSearch("beef")}>
                <div className="ingredient-img-container">
                  <img src="/src/assets/ingredients/beef.jpg" alt="Beef" className="ingredient-img" />
                </div>
                <h3>Beef</h3>
              </div>
              
              <div className="ingredient-card" onClick={() => handleSearch("rice")}>
                <div className="ingredient-img-container">
                  <img src="/src/assets/ingredients/rice.jpg" alt="Rice" className="ingredient-img" />
                </div>
                <h3>Rice</h3>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="section how-it-works-section">
          <div className="container">
            <h2 className="section-title">How Ordelo Works</h2>
            
            <div className="steps-container">
              <div className="step">
                <div className="step-icon">
                  <i className="fas fa-search"></i>
                </div>
                <h3>Find Recipes</h3>
                <p>Search for recipes or browse by cuisine to find dishes you love.</p>
              </div>
              
              <div className="step">
                <div className="step-icon">
                  <i className="fas fa-heart"></i>
                </div>
                <h3>Save Favorites</h3>
                <p>Save your favorite recipes to easily access them later.</p>
              </div>
              
              <div className="step">
                <div className="step-icon">
                  <i className="fas fa-shopping-basket"></i>
                </div>
                <h3>Auto Shopping List</h3>
                <p>Ingredients are automatically added to your shopping list.</p>
              </div>
              
              <div className="step">
                <div className="step-icon">
                  <i className="fas fa-utensils"></i>
                </div>
                <h3>Cook & Enjoy</h3>
                <p>Follow the recipe instructions and enjoy your meal!</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;