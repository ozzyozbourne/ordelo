// src/services/spoonacularApi.js
// Optimized service for Spoonacular API calls

import axios from 'axios';
import { createOptimizedAxios, retryRequest } from '../utils/apiUtils';
import { 
  cacheRecipe, getCachedRecipe, 
  cacheSearchResults, getCachedSearchResults,
  cacheCuisineResults, getCachedCuisineResults,
  cleanupCache
} from './recipeCache';
import { 
  canMakeApiCall, incrementApiUsage, 
  isCacheOnlyMode, initApiTracker 
} from './apiTracker';

// Constants
const API_BASE_URL = 'https://api.spoonacular.com';
const SPOONACULAR_API_KEY = 'e5417c0a2e4c4fca8b644c983f8327ee';

// Create a base axios instance for Spoonacular
const spoonacularAxios = axios.create({
  baseURL: API_BASE_URL,
  params: {
    apiKey: SPOONACULAR_API_KEY
  }
});

// Create an optimized version with deduplication
const api = createOptimizedAxios(spoonacularAxios);

// Initialize API tracker
initApiTracker();

// Run cache cleanup once a day
const initCacheCleanup = () => {
  // Run immediately on startup
  cleanupCache();
  
  // Run once per day
  setInterval(cleanupCache, 24 * 60 * 60 * 1000);
};

// Initialize cache cleanup
initCacheCleanup();

// Fetch random recipes with caching
export const fetchRandomRecipes = async (options = {}) => {
  const params = {
    number: options.number || 8,
    ...options
  };
  
  // Try to get from cache if in cache-only mode
  if (isCacheOnlyMode()) {
    try {
      // For random recipes in cache-only mode, we'll just return the 8 most recently cached recipes
      const cachedRecipe = await getCachedRecipe('random');
      if (cachedRecipe && cachedRecipe.results) {
        console.log('Using cached random recipes (cache-only mode)');
        return cachedRecipe.results;
      }
    } catch (err) {
      console.error('Error getting cached random recipes:', err);
    }
  }
  
  // If we can make an API call
  if (canMakeApiCall()) {
    try {
      const response = await retryRequest(() => api.get('/recipes/random', { params }));
      
      // Increment API usage counter
      incrementApiUsage();
      
      // Cache the results
      const recipes = response.data.recipes;
      
      // Also cache each individual recipe
      recipes.forEach(recipe => cacheRecipe(recipe));
      
      // Cache the random results too under a special key
      await cacheRecipe({
        id: 'random',
        results: recipes,
        timestamp: Date.now()
      });
      
      return recipes;
    } catch (error) {
      console.error('Error fetching random recipes:', error);
      throw error;
    }
  } else {
    console.warn('API limit reached: Using cached data for random recipes');
    
    // In a real app, you could show a notification to the user
    // For now, just throw an error
    throw new Error('Daily API limit reached. Please try again tomorrow or use cached recipes.');
  }
};

// Search recipes with caching
export const searchRecipes = async (query, options = {}) => {
  if (!query) return [];
  
  const searchQuery = query.toLowerCase().trim();
  const params = {
    query: searchQuery,
    number: options.number || 12,
    addRecipeInformation: true,
    fillIngredients: true,
    ...options
  };
  
  // First check the cache
  try {
    const cachedData = await getCachedSearchResults(searchQuery);
    if (cachedData) {
      console.log(`Using cached search results for "${searchQuery}"`);
      
      // If cache isn't stale, or we're in cache-only mode, return it directly
      if (!cachedData.isStale || isCacheOnlyMode()) {
        return cachedData.results;
      }
      
      // If cache is stale but we're online, refresh in the background
      if (cachedData.isStale && canMakeApiCall()) {
        console.log(`Refreshing stale search results for "${searchQuery}" in background`);
        
        // Return the stale cache immediately
        setTimeout(() => {
          // Make the API call in the background to refresh the cache
          api.get('/recipes/complexSearch', { params })
            .then(response => {
              incrementApiUsage();
              cacheSearchResults(searchQuery, response.data.results);
            })
            .catch(err => console.error('Background cache refresh failed:', err));
        }, 100);
        
        return cachedData.results;
      }
    }
  } catch (err) {
    console.error('Error getting cached search results:', err);
  }
  
  // If we got here, we need to make an API call
  if (canMakeApiCall()) {
    try {
      const response = await retryRequest(() => api.get('/recipes/complexSearch', { params }));
      
      // Increment API usage counter
      incrementApiUsage();
      
      // Cache the results
      const recipes = response.data.results;
      await cacheSearchResults(searchQuery, recipes);
      
      return recipes;
    } catch (error) {
      console.error(`Error searching recipes for "${searchQuery}":`, error);
      throw error;
    }
  } else {
    console.warn('API limit reached: Cannot make new search request');
    throw new Error('Daily API limit reached. Please try again tomorrow or use previously viewed recipes.');
  }
};

// Filter recipes by cuisine with caching
export const filterRecipesByCuisine = async (cuisine, options = {}) => {
  if (!cuisine) return [];
  
  const cuisineKey = cuisine.toLowerCase();
  const params = {
    cuisine: cuisineKey,
    number: options.number || 8,
    addRecipeInformation: true,
    ...options
  };
  
  // First check the cache
  try {
    const cachedData = await getCachedCuisineResults(cuisineKey);
    if (cachedData) {
      console.log(`Using cached cuisine results for "${cuisineKey}"`);
      
      // If cache isn't stale, or we're in cache-only mode, return it directly
      if (!cachedData.isStale || isCacheOnlyMode()) {
        return cachedData.results;
      }
      
      // If cache is stale but we're online, refresh in the background
      if (cachedData.isStale && canMakeApiCall()) {
        console.log(`Refreshing stale cuisine results for "${cuisineKey}" in background`);
        
        // Return the stale cache immediately
        setTimeout(() => {
          // Make the API call in the background to refresh the cache
          api.get('/recipes/complexSearch', { params })
            .then(response => {
              incrementApiUsage();
              cacheCuisineResults(cuisineKey, response.data.results);
            })
            .catch(err => console.error('Background cache refresh failed:', err));
        }, 100);
        
        return cachedData.results;
      }
    }
  } catch (err) {
    console.error('Error getting cached cuisine results:', err);
  }
  
  // If we got here, we need to make an API call
  if (canMakeApiCall()) {
    try {
      const response = await retryRequest(() => api.get('/recipes/complexSearch', { params }));
      
      // Increment API usage counter
      incrementApiUsage();
      
      // Cache the results
      const recipes = response.data.results;
      await cacheCuisineResults(cuisineKey, recipes);
      
      return recipes;
    } catch (error) {
      console.error(`Error fetching ${cuisineKey} recipes:`, error);
      throw error;
    }
  } else {
    console.warn('API limit reached: Cannot make new cuisine filter request');
    throw new Error('Daily API limit reached. Please try again tomorrow or use previously viewed recipes.');
  }
};

// Fetch recipe details with caching
export const fetchRecipeById = async (id, options = {}) => {
  if (!id) return null;
  
  // Convert to number if it's a string
  const recipeId = typeof id === 'string' ? parseInt(id) : id;
  const params = {
    includeNutrition: true,
    ...options
  };
  
  // First check the cache
  try {
    const cachedRecipe = await getCachedRecipe(recipeId);
    if (cachedRecipe) {
      console.log(`Using cached recipe for id ${recipeId}`);
      
      // If cache isn't stale, or we're in cache-only mode, return it directly
      if (!cachedRecipe.isStale || isCacheOnlyMode()) {
        return cachedRecipe;
      }
      
      // If cache is stale but we're online, refresh in the background
      if (cachedRecipe.isStale && canMakeApiCall()) {
        console.log(`Refreshing stale recipe for id ${recipeId} in background`);
        
        // Return the stale cache immediately
        setTimeout(() => {
          // Make the API call in the background to refresh the cache
          api.get(`/recipes/${recipeId}/information`, { params })
            .then(response => {
              incrementApiUsage();
              cacheRecipe(response.data);
            })
            .catch(err => console.error('Background cache refresh failed:', err));
        }, 100);
        
        return cachedRecipe;
      }
    }
  } catch (err) {
    console.error('Error getting cached recipe:', err);
  }
  
  // If we got here, we need to make an API call
  if (canMakeApiCall()) {
    try {
      const response = await retryRequest(() => api.get(`/recipes/${recipeId}/information`, { params }));
      
      // Increment API usage counter
      incrementApiUsage();
      
      // Cache the recipe
      const recipe = response.data;
      await cacheRecipe(recipe);
      
      return recipe;
    } catch (error) {
      console.error(`Error fetching recipe id ${recipeId}:`, error);
      throw error;
    }
  } else {
    console.warn('API limit reached: Cannot make new recipe detail request');
    throw new Error('Daily API limit reached. Please try again tomorrow or view previously accessed recipes.');
  }
};

// Export API usage information for components that need it
export const getApiUsageInfo = () => {
  return {
    isLimited: isCacheOnlyMode(),
    ...initApiTracker()
  }
};
