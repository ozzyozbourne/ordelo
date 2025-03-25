// src/services/recipeCache.js
// Recipe caching operations using IndexedDB
import { addItem, getItem, getAllItems, deleteOldItems, STORES } from './db';

// Cache duration constants (in milliseconds)
const CACHE_DURATIONS = {
  RECIPE: 30 * 24 * 60 * 60 * 1000, // 30 days for individual recipes
  SEARCH: 24 * 60 * 60 * 1000,      // 24 hours for search results
  CUISINE: 24 * 60 * 60 * 1000      // 24 hours for cuisine filters
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
  if (!cuisine || !results) return false;
  
  const cuisineData = {
    cuisine: cuisine.toLowerCase(),
    results,
    timestamp: Date.now()
  };
  
  await cacheRecipes(results);
  return await addItem(STORES.CUISINES, cuisineData);
};

// Get cached cuisine filter results
export const getCachedCuisineResults = async (cuisine) => {
  if (!cuisine) return null;
  
  const cuisineKey = cuisine.toLowerCase();
  const cuisineData = await getItem(STORES.CUISINES, cuisineKey);
  
  if (!cuisineData) return null;
  
  // Check if cache is expired
  const now = Date.now();
  if (now - cuisineData.timestamp > CACHE_DURATIONS.CUISINE) {
    // Cache is stale, but return it anyway (will be refreshed in background)
    cuisineData.isStale = true;
  }
  
  return cuisineData;
};

// Clean up old cache entries to prevent IndexedDB from growing too large
export const cleanupCache = async () => {
  try {
    const recipeDeleteCount = await deleteOldItems(STORES.RECIPES, CACHE_DURATIONS.RECIPE * 2);
    const searchDeleteCount = await deleteOldItems(STORES.SEARCHES, CACHE_DURATIONS.SEARCH * 2);
    const cuisineDeleteCount = await deleteOldItems(STORES.CUISINES, CACHE_DURATIONS.CUISINE * 2);
    
    console.log(`Cache cleanup: Removed ${recipeDeleteCount} recipes, ${searchDeleteCount} searches, and ${cuisineDeleteCount} cuisine filters`);
    
    return true;
  } catch (error) {
    console.error('Error during cache cleanup:', error);
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
