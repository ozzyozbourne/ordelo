// src/context/RecipeContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { 
  fetchRandomRecipes, 
  searchRecipes, 
  fetchRecipeById, 
  filterRecipesByCuisine,
  getApiUsageInfo
} from "../services/spoonacularApi";
import { createNetworkDetector } from "../utils/apiUtils";

const RecipeContext = createContext();

export const RecipeProvider = ({ children }) => {
  const [recipes, setRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [networkStatus, setNetworkStatus] = useState({ isOnline: true });
  const [apiStatus, setApiStatus] = useState({ isLimited: false, count: 0 });

  // Load saved recipes and shopping list from localStorage
  useEffect(() => {
    const savedRecipesData = localStorage.getItem("savedRecipes");
    const shoppingListData = localStorage.getItem("shoppingList");
    const selectedRecipesData = localStorage.getItem("selectedRecipes");
    
    if (savedRecipesData) {
      setSavedRecipes(JSON.parse(savedRecipesData));
    }
    
    if (shoppingListData) {
      setShoppingList(JSON.parse(shoppingListData));
    }
    
    if (selectedRecipesData) {
      setSelectedRecipes(JSON.parse(selectedRecipesData));
    }
    
    // Initialize network status detector
    const networkDetector = createNetworkDetector();
    setNetworkStatus({ isOnline: networkDetector.isOnline() });
    
    const removeNetworkListener = networkDetector.onNetworkChange((online) => {
      setNetworkStatus({ isOnline: online });
      if (!online) {
        showToast('You are offline. Using cached recipes.', 'warning');
      } else {
        showToast('You are back online!', 'success');
      }
    });
    
    // Update API status initially and periodically
    const updateApiStatus = () => {
      const status = getApiUsageInfo();
      setApiStatus(status);
      
      if (status.isLimited && !apiStatus.isLimited) {
        showToast('Daily API limit reached. Using cached recipes only until tomorrow.', 'error');
      }
    };
    
    updateApiStatus();
    const apiStatusInterval = setInterval(updateApiStatus, 5 * 60 * 1000); // Check every 5 minutes
    
    // Fetch initial recipes
    fetchInitialRecipes();
    
    return () => {
      removeNetworkListener();
      clearInterval(apiStatusInterval);
    };
  }, []);

  // Update localStorage when saved recipes change
  useEffect(() => {
    localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
  }, [savedRecipes]);
  
  // Update localStorage when shopping list changes
  useEffect(() => {
    localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
  }, [shoppingList]);
  
  // Update localStorage when selected recipes change
  useEffect(() => {
    localStorage.setItem("selectedRecipes", JSON.stringify(selectedRecipes));
  }, [selectedRecipes]);

  // Toast disappears after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch initial recipes with error handling and network awareness
  const fetchInitialRecipes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newRecipes = await fetchRandomRecipes();
      setRecipes(newRecipes);
    } catch (error) {
      console.error("Error fetching initial recipes:", error);
      
      // Only show error message if we're online
      if (networkStatus.isOnline) {
        setError("Failed to fetch recipes. Please try again later.");
      } else {
        setError("You're offline. Please connect to the internet and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Modified version using our optimized API service
  const fetchRandomRecipesHandler = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newRecipes = await fetchRandomRecipes();
      setRecipes(newRecipes);
    } catch (error) {
      console.error("Error fetching random recipes:", error);
      setError(error.message || "Failed to fetch recipes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Modified search using our optimized API service
  const searchRecipesHandler = async (query) => {
    if (!query || query.trim() === '') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const searchResults = await searchRecipes(query);
      setRecipes(searchResults);
    } catch (error) {
      console.error("Error searching recipes:", error);
      setError(error.message || "Failed to search recipes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Modified recipe details using our optimized API service
  const fetchRecipeByIdHandler = async (id) => {
    if (!id) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const recipe = await fetchRecipeById(id);
      return recipe;
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      setError(error.message || "Failed to fetch recipe details. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Modified cuisine filter using our optimized API service
  const filterRecipesByCuisineHandler = async (cuisine) => {
    if (!cuisine) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const filteredRecipes = await filterRecipesByCuisine(cuisine);
      setRecipes(filteredRecipes);
    } catch (error) {
      console.error(`Error fetching ${cuisine} recipes:`, error);
      setError(error.message || `Failed to fetch ${cuisine} recipes. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSaveRecipe = (recipe) => {
    const isAlreadySaved = savedRecipes.some(savedRecipe => savedRecipe.id === recipe.id);
    
    if (isAlreadySaved) {
      // Remove from saved recipes
      setSavedRecipes(savedRecipes.filter(savedRecipe => savedRecipe.id !== recipe.id));
      showToast("Recipe removed from saved recipes", "error");
    } else {
      // Add to saved recipes
      setSavedRecipes([...savedRecipes, recipe]);
      showToast("Recipe saved successfully", "success");
    }
  };

  // Add these new methods for selected recipes
  const addToSelectedRecipes = (recipe) => {
    // Check if recipe is already selected
    if (!selectedRecipes.some(r => r.id === recipe.id)) {
      setSelectedRecipes([...selectedRecipes, recipe]);
      showToast(`${recipe.title} added to selected recipes`, "success");
    } else {
      showToast(`${recipe.title} is already selected`, "info");
    }
  };

  const removeFromSelected = (recipeId) => {
    setSelectedRecipes(selectedRecipes.filter(recipe => recipe.id !== recipeId));
    showToast("Recipe removed from selected recipes", "error");
  };

  const clearSelectedRecipes = () => {
    setSelectedRecipes([]);
    showToast("Selected recipes cleared", "error");
  };

  const addToShoppingList = (ingredients) => {
    const newIngredients = ingredients.filter(
      ingredient => !shoppingList.some(item => item.id === ingredient.id)
    );
    
    if (newIngredients.length > 0) {
      setShoppingList([...shoppingList, ...newIngredients]);
      showToast(`${newIngredients.length} ingredients added to shopping list`, "success");
    } else {
      showToast("Ingredients already in shopping list", "error");
    }
  };

  const removeFromShoppingList = (ingredientId) => {
    setShoppingList(shoppingList.filter(item => item.id !== ingredientId));
    showToast("Ingredient removed from shopping list", "error");
  };

  const clearShoppingList = () => {
    setShoppingList([]);
    showToast("Shopping list cleared", "error");
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        savedRecipes,
        shoppingList,
        isLoading,
        error,
        toast,
        selectedRecipes,
        networkStatus,
        apiStatus,
        fetchRandomRecipes: fetchRandomRecipesHandler,
        searchRecipes: searchRecipesHandler,
        fetchRecipeById: fetchRecipeByIdHandler,
        filterRecipesByCuisine: filterRecipesByCuisineHandler,
        toggleSaveRecipe,
        addToShoppingList,
        removeFromShoppingList,
        clearShoppingList,
        showToast,
        addToSelectedRecipes,
        removeFromSelected,
        clearSelectedRecipes,
      }}
    >
      {children}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? (
              <i className="fas fa-check-circle"></i>
            ) : toast.type === "warning" ? (
              <i className="fas fa-exclamation-triangle"></i>
            ) : (
              <i className="fas fa-exclamation-circle"></i>
            )}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </RecipeContext.Provider>
  );
};

// Custom hook to use the recipe context
export const useRecipes = () => useContext(RecipeContext);

export default RecipeContext;
