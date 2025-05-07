// src/services/recipeCache.js
// Recipe caching operations using IndexedDB
import { addItem, getItem, getAllItems, deleteOldItems, STORES } from './db';

// Cache duration constants (in milliseconds)
const CACHE_DURATIONS = {
  RECIPE: 30 * 24 * 60 * 60 * 1000, // 30 days for individual recipes
  SEARCH: 24 * 60 * 60 * 1000,      // 24 hours for search results
  CUISINE: 24 * 60 * 60 * 1000      // 24 hours for cuisine filters
};

// Cache logging utility
const logCache = (message, type = 'info', details = {}) => {
  const timestamp = new Date().toISOString();
  const logStyles = {
    info: 'color: #2196F3',
    success: 'color: #4CAF50',
    warning: 'color: #FFC107',
    error: 'color: #F44336'
  };
  
  console.log(
    `%c[Recipe Cache ${timestamp}] ${message}`,
    logStyles[type],
    details
  );
};

// Save a recipe to the cache
export const cacheRecipe = async (recipe) => {
  if (!recipe || !recipe.id) return false;
  return await addItem(STORES.RECIPES, recipe);
};

// Save multiple recipes to the cache
export const cacheRecipes = async (recipes) => {
  if (!recipes || !Array.isArray(recipes)) return false;
  
  const promises = recipes.map(recipe => {
    if (recipe && recipe.id) {
      return cacheRecipe(recipe);
    }
    return Promise.resolve(false);
  });
  
  return Promise.all(promises);
};

// Get a recipe from the cache by ID
export const getCachedRecipe = async (recipeId) => {
  if (!recipeId) return null;
  
  // Convert to number if it's a string (URLs often have string IDs)
  const id = typeof recipeId === 'string' ? parseInt(recipeId) : recipeId;
  const recipe = await getItem(STORES.RECIPES, id);
  
  if (!recipe) return null;
  
  // Check if cache is expired
  const now = Date.now();
  if (now - recipe.timestamp > CACHE_DURATIONS.RECIPE) {
    // Cache is stale, but return it anyway (will be refreshed in background)
    recipe.isStale = true;
  }
  
  return recipe;
};

// Save search results to cache
export const cacheSearchResults = async (query, results) => {
  if (!query || !results) return false;
  
  const searchData = {
    query: query.toLowerCase().trim(),
    results,
    timestamp: Date.now()
  };
  
  await cacheRecipes(results);
  return await addItem(STORES.SEARCHES, searchData);
};

// Get cached search results
export const getCachedSearchResults = async (query) => {
  if (!query) return null;
  
  const searchQuery = query.toLowerCase().trim();
  const searchData = await getItem(STORES.SEARCHES, searchQuery);
  
  if (!searchData) return null;
  
  // Check if cache is expired
  const now = Date.now();
  if (now - searchData.timestamp > CACHE_DURATIONS.SEARCH) {
    // Cache is stale, but return it anyway (will be refreshed in background)
    searchData.isStale = true;
  }
  
  return searchData;
};

// Save cuisine filter results to cache
export const cacheCuisineResults = async (cuisine, results) => {
  if (!cuisine || !results) {
    console.error('Invalid cuisine or results:', { cuisine, resultsLength: results?.length });
    return false;
  }
  
  try {
    // First cache individual recipes with their full data
    const validRecipes = results.filter(recipe => 
      recipe && recipe.id && recipe.title && recipe.extendedIngredients
    );

    if (validRecipes.length === 0) {
      console.error('No valid recipes to cache');
      return false;
    }

    // Cache each recipe individually first
    await Promise.all(validRecipes.map(recipe => cacheRecipe(recipe)));

    // Then store the cuisine-recipe mapping with just IDs
    const cuisineData = {
      cuisine: cuisine.toLowerCase(),
      results: validRecipes.map(recipe => recipe.id),
      timestamp: Date.now()
    };
    
    const success = await addItem(STORES.CUISINES, cuisineData);
    
    if (!success) {
      console.error('Failed to cache cuisine data:', cuisineData);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error caching cuisine results:', error);
    return false;
  }
};

// Get cached cuisine filter results
export const getCachedCuisineResults = async (cuisine) => {
  if (!cuisine) return null;
  
  try {
    const cuisineKey = cuisine.toLowerCase();
    const cuisineData = await getItem(STORES.CUISINES, cuisineKey);
    
    if (!cuisineData) return null;
    
    // Check if cache is expired
    const now = Date.now();
    if (now - cuisineData.timestamp > CACHE_DURATIONS.CUISINE) {
      cuisineData.isStale = true;
    }
    
    // Get the full recipe data for each ID
    const recipePromises = cuisineData.results.map(async (recipeId) => {
      // Ensure recipeId is a number
      const id = typeof recipeId === 'string' ? parseInt(recipeId, 10) : recipeId;
      if (isNaN(id)) {
        console.error('Invalid recipe ID:', recipeId);
        return null;
      }
      return await getCachedRecipe(id);
    });
    
    const recipes = await Promise.all(recipePromises);
    
    // Filter out any null results and recipes without required data
    const validRecipes = recipes.filter(recipe => 
      recipe && recipe.id && recipe.title && recipe.extendedIngredients
    );
    
    if (validRecipes.length === 0) {
      console.log('No valid recipes found in cache for cuisine:', cuisineKey);
      return null;
    }
    
    return {
      results: validRecipes,
      isStale: cuisineData.isStale
    };
  } catch (error) {
    console.error('Error getting cached cuisine results:', error);
    return null;
  }
};

// Clean up old cache entries to prevent IndexedDB from growing too large
export const cleanupCache = async () => {
  try {
    logCache('Starting cache cleanup...', 'info', {
      durations: {
        recipes: `${CACHE_DURATIONS.RECIPE / (24 * 60 * 60 * 1000)} days`,
        searches: `${CACHE_DURATIONS.SEARCH / (60 * 60 * 1000)} hours`,
        cuisines: `${CACHE_DURATIONS.CUISINE / (60 * 60 * 1000)} hours`
      }
    });

    const [recipeCount, searchCount, cuisineCount] = await Promise.all([
      getAllItems(STORES.RECIPES).then(items => items.length),
      getAllItems(STORES.SEARCHES).then(items => items.length),
      getAllItems(STORES.CUISINES).then(items => items.length)
    ]);

    const beforeCounts = {
      recipes: recipeCount,
      searches: searchCount,
      cuisines: cuisineCount
    };

    logCache('Current cache status', 'info', { itemCounts: beforeCounts });

    const [recipeDeleteCount, searchDeleteCount, cuisineDeleteCount] = await Promise.all([
      deleteOldItems(STORES.RECIPES, CACHE_DURATIONS.RECIPE * 2),
      deleteOldItems(STORES.SEARCHES, CACHE_DURATIONS.SEARCH * 2),
      deleteOldItems(STORES.CUISINES, CACHE_DURATIONS.CUISINE * 2)
    ]);

    const deletedCounts = {
      recipes: recipeDeleteCount,
      searches: searchDeleteCount,
      cuisines: cuisineDeleteCount
    };

    const type = Object.values(deletedCounts).some(count => count > 0) ? 'warning' : 'success';
    logCache(
      'Cache cleanup completed', 
      type,
      {
        itemsRemoved: deletedCounts,
        remainingItems: {
          recipes: recipeCount - recipeDeleteCount,
          searches: searchCount - searchDeleteCount,
          cuisines: cuisineCount - cuisineDeleteCount
        }
      }
    );
    
    return true;
  } catch (error) {
    logCache('Error during cache cleanup', 'error', { error: error.message });
    return false;
  }
};

// Check if we can serve data from cache only
export const isCacheAvailable = async (type, key) => {
  switch (type) {
    case 'recipe':
      return !!(await getCachedRecipe(key));
    case 'search':
      return !!(await getCachedSearchResults(key));
    case 'cuisine':
      return !!(await getCachedCuisineResults(key));
    default:
      return false;
  }
};