import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const RecipeContext = createContext();

const SPOONACULAR_API_KEY = "5337e71f5d9743ffad0ad4307681f80c";

export const RecipeProvider = ({ children }) => {
  const [recipes, setRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Load saved recipes and shopping list from localStorage
  useEffect(() => {
    const savedRecipesData = localStorage.getItem("savedRecipes");
    const shoppingListData = localStorage.getItem("shoppingList");
    
    if (savedRecipesData) {
      setSavedRecipes(JSON.parse(savedRecipesData));
    }
    
    if (shoppingListData) {
      setShoppingList(JSON.parse(shoppingListData));
    }
    
    // Fetch initial recipes
    fetchRandomRecipes();
  }, []);

  // Update localStorage when saved recipes change
  useEffect(() => {
    localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
  }, [savedRecipes]);
  
  // Update localStorage when shopping list changes
  useEffect(() => {
    localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
  }, [shoppingList]);

  // Toast disappears after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchRandomRecipes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get("https://api.spoonacular.com/recipes/random", {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          number: 8
        }
      });
      
      setRecipes(response.data.recipes);
    } catch (error) {
      console.error("Error fetching random recipes:", error);
      setError("Failed to fetch recipes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const searchRecipes = async (query) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get("https://api.spoonacular.com/recipes/complexSearch", {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          query,
          number: 12,
          addRecipeInformation: true,
          fillIngredients: true
        }
      });
      
      setRecipes(response.data.results);
    } catch (error) {
      console.error("Error searching recipes:", error);
      setError("Failed to search recipes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecipeById = async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`https://api.spoonacular.com/recipes/${id}/information`, {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          includeNutrition: true
        }
      });
      
      return response.data;
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      setError("Failed to fetch recipe details. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecipesByCuisine = async (cuisine) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get("https://api.spoonacular.com/recipes/complexSearch", {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          cuisine,
          number: 8,
          addRecipeInformation: true
        }
      });
      
      setRecipes(response.data.results);
    } catch (error) {
      console.error(`Error fetching ${cuisine} recipes:`, error);
      setError(`Failed to fetch ${cuisine} recipes. Please try again.`);
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
        fetchRandomRecipes,
        searchRecipes,
        fetchRecipeById,
        filterRecipesByCuisine,
        toggleSaveRecipe,
        addToShoppingList,
        removeFromShoppingList,
        clearShoppingList,
        showToast,
      }}
    >
      {children}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? (
              <i className="fas fa-check-circle"></i>
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