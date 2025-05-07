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
  const [shoppingList, setShoppingList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [networkStatus, setNetworkStatus] = useState({ isOnline: true });
  const [apiStatus, setApiStatus] = useState({ isLimited: false, count: 0 });

  useEffect(() => {
    const shoppingListData = localStorage.getItem("shoppingList");
    const selectedRecipesData = localStorage.getItem("selectedRecipes");

    if (shoppingListData) {
      setShoppingList(JSON.parse(shoppingListData));
    }

    if (selectedRecipesData) {
      setSelectedRecipes(JSON.parse(selectedRecipesData));
    }

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

    const updateApiStatus = () => {
      const status = getApiUsageInfo();
      setApiStatus(status);

      if (status.isLimited && !apiStatus.isLimited) {
        showToast('Daily API limit reached. Using cached recipes only until tomorrow.', 'error');
      }
    };
    updateApiStatus();
    const apiStatusInterval = setInterval(updateApiStatus, 5 * 60 * 1000);

    fetchInitialRecipes();

    return () => {
      removeNetworkListener();
      clearInterval(apiStatusInterval);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem("selectedRecipes", JSON.stringify(selectedRecipes));
  }, [selectedRecipes]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchInitialRecipes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newRecipes = await fetchRandomRecipes();
      setRecipes(newRecipes);
    } catch (error) {
      console.error("Error fetching initial recipes:", error);
      if (networkStatus.isOnline) {
        setError("Failed to fetch recipes. Please try again later.");
      } else {
        setError("You're offline. Please connect to the internet and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  const addToSelectedRecipes = (recipe) => {
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

export const useRecipes = () => useContext(RecipeContext);

export default RecipeContext;