// src/services/spoonacularApi.js

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
import { STORES, addItem, getItem } from './db';

const API_BASE_URL = 'https://api.spoonacular.com';
const API_KEYS = [
  '156946039c8f49ee802ce33f0b0d31cc',  // This will fail immediately
  'e5417c0a2e4c4fca8b644c983f8327ee',  // This should work
  '5337e71f5d9743ffad0ad4307681f80c'   // This is our backup
];

// Request tracking
let requestCounter = 0;
const activeRequests = new Map();

// Enhanced logging utility
const logApiCall = (requestId, message, type = 'info', details = {}) => {
  const timestamp = new Date().toISOString();
  const logStyles = {
    info: 'color: #2196F3',
    success: 'color: #4CAF50',
    warning: 'color: #FFC107',
    error: 'color: #F44336',
    dedup: 'color: #9C27B0'
  };
  
  console.log(
    `%c[Spoonacular API ${timestamp}] (Request ${requestId}) ${message}`,
    logStyles[type],
    details
  );
};

const createSpoonacularAxios = (apiKey) => {
  return axios.create({
    baseURL: API_BASE_URL,
    params: { apiKey }
  });
};

const tryApiCallWithFallback = async (apiCallFunction) => {
  const requestId = ++requestCounter;
  const startTime = Date.now();
  let attemptCount = 0;
  
  // Extract endpoint from the function
  const endpoint = apiCallFunction.toString().split('api.get(\'')[1]?.split('\'')[0] || 'unknown';
  
  // Check for existing request
  const existingRequest = Array.from(activeRequests.entries())
    .find(([_, req]) => req.endpoint === endpoint);
  
  if (existingRequest) {
    const [existingId, request] = existingRequest;
    logApiCall(requestId, `Request deduplication: Reusing request ${existingId} for ${endpoint}`, 'dedup', {
      originalRequestId: existingId,
      endpoint,
      timeSinceOriginal: `${Date.now() - request.startTime}ms`
    });
    return request.promise;
  }
  
  logApiCall(requestId, 'Starting API call with fallback mechanism', 'info', {
    availableKeys: API_KEYS.length,
    endpoint
  });

  // Create a promise for this request
  const requestPromise = (async () => {
    for (const apiKey of API_KEYS) {
      attemptCount++;
      const maskedKey = `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`;
      
      logApiCall(requestId, `Attempt ${attemptCount}/${API_KEYS.length} with key ${maskedKey}`, 'info', {
        keyIndex: attemptCount - 1
      });

      try {
        const spoonacularAxios = createSpoonacularAxios(apiKey);
        const optimizedAxios = createOptimizedAxios(spoonacularAxios);
        
        logApiCall(requestId, 'Making API request...', 'info', {
          attempt: attemptCount,
          key: maskedKey
        });

        const result = await apiCallFunction(optimizedAxios);
        
        const duration = Date.now() - startTime;
        logApiCall(requestId, `API call successful with key ${maskedKey}`, 'success', {
          duration: `${duration}ms`,
          attempt: attemptCount
        });
        
        return result;
      } catch (error) {
        const errorStatus = error.response?.status;
        const errorMessage = error.message;
        
        logApiCall(
          requestId,
          `API call failed with key ${maskedKey}`,
          'error',
          {
            status: errorStatus,
            message: errorMessage,
            attempt: attemptCount,
            duration: `${Date.now() - startTime}ms`
          }
        );

        if (errorStatus === 402 || errorStatus === 429) {
          logApiCall(requestId, `Key ${maskedKey} exhausted, trying next key...`, 'warning', {
            remainingKeys: API_KEYS.length - attemptCount
          });
          continue;
        }

        throw error;
      }
    }

    const duration = Date.now() - startTime;
    logApiCall(requestId, 'All API keys exhausted', 'error', {
      totalAttempts: attemptCount,
      totalDuration: `${duration}ms`
    });
    
    throw new Error('All Spoonacular API keys have failed');
  })();

  // Store the request
  activeRequests.set(requestId, {
    promise: requestPromise,
    endpoint,
    startTime
  });

  // Clean up after request completes
  requestPromise.finally(() => {
    activeRequests.delete(requestId);
  });

  return requestPromise;
};

initApiTracker();
initCacheCleanup();

function initCacheCleanup() {
  cleanupCache();
  setInterval(cleanupCache, 24 * 60 * 60 * 1000);
}

// -----------------------------
// OPTIMIZED API SERVICE METHODS
// -----------------------------

export const fetchRandomRecipes = async () => {
  const params = {
    number: 12,
    addRecipeInformation: true,
    fillIngredients: true
  };

  // Check for today's cached recipes first
  const dailyCache = await getItem(STORES.DAILY, 'random');
  const now = Date.now();
  const isToday = dailyCache?.timestamp && 
    new Date(dailyCache.timestamp).toDateString() === new Date(now).toDateString();

  // If we have today's recipes, return them
  if (dailyCache?.recipes && isToday) {
    console.log('Using today\'s cached random recipes');
    return dailyCache.recipes;
  }

  // Only make API call if we don't have today's recipes
  if (canMakeApiCall()) {
    try {
      const recipes = await tryApiCallWithFallback(async (api) => {
        const response = await retryRequest(() => api.get('/recipes/random', { params }));
        incrementApiUsage();
        return response.data.recipes;
      });

      // Cache individual recipes
      await Promise.all(recipes.map(recipe => cacheRecipe(recipe)));
      
      // Cache today's random recipes with timestamp
      await addItem(STORES.DAILY, { 
        key: 'random',
        recipes: recipes,
        timestamp: now 
      });

      return recipes;
    } catch (error) {
      console.error('Error fetching random recipes:', error);
      
      // If API call fails but we have cached recipes (even if old), use them as fallback
      if (dailyCache?.recipes) {
        console.log('Using cached recipes as fallback after API error');
        return dailyCache.recipes;
      }
      
      throw error;
    }
  } else {
    // If we can't make API call but have cached recipes, use them
    if (dailyCache?.recipes) {
      console.log('Using cached recipes (API limit reached)');
      return dailyCache.recipes;
    }
    throw new Error('Daily API limit reached and no cached recipes available.');
  }
};

export const searchRecipes = async (query) => {
  if (!query) return [];

  const searchQuery = query.toLowerCase().trim();
  const params = {
    query: searchQuery,
    number: 12,
    addRecipeInformation: true,
    fillIngredients: true
  };

  const cachedData = await getCachedSearchResults(searchQuery);
  if (cachedData && (!cachedData.isStale || isCacheOnlyMode())) {
    console.log(`Using cached search for "${searchQuery}"`);
    return cachedData.results;
  }

  if (canMakeApiCall()) {
    try {
      const recipes = await tryApiCallWithFallback(async (api) => {
        const response = await retryRequest(() => api.get('/recipes/complexSearch', { params }));
        incrementApiUsage();
        return response.data.results;
      });

      await cacheSearchResults(searchQuery, recipes);
      return recipes;
    } catch (error) {
      console.error('Error searching recipes:', error);
      throw error;
    }
  } else {
    throw new Error('Daily API limit reached.');
  }
};

export const filterRecipesByCuisine = async (cuisine) => {
  if (!cuisine) return [];

  const cuisineKey = cuisine.toLowerCase();
  const params = {
    cuisine: cuisineKey,
    number: 12,
    addRecipeInformation: true,
    fillIngredients: true,
    instructionsRequired: true
  };

  const cachedData = await getCachedCuisineResults(cuisineKey);
  if (cachedData && (!cachedData.isStale || isCacheOnlyMode())) {
    console.log(`Using cached cuisine "${cuisineKey}"`);
    return cachedData.results;
  }

  if (canMakeApiCall()) {
    try {
      const recipes = await tryApiCallWithFallback(async (api) => {
        const response = await retryRequest(() => api.get('/recipes/complexSearch', { params }));
        incrementApiUsage();
        
        // Log what we got from the API
        console.log('Cuisine search response:', {
          count: response.data.results.length,
          sampleRecipe: response.data.results[0] ? {
            id: response.data.results[0].id,
            hasIngredients: !!response.data.results[0].extendedIngredients,
            hasInstructions: !!response.data.results[0].analyzedInstructions
          } : null
        });
        
        return response.data.results;
      });

      // If we got recipes but they're missing detailed data, fetch each one individually
      const completeRecipes = await Promise.all(
        recipes.map(async (recipe) => {
          if (!recipe.extendedIngredients || !recipe.analyzedInstructions) {
            console.log(`Fetching complete data for recipe ${recipe.id}`);
            return await fetchRecipeById(recipe.id);
          }
          return recipe;
        })
      );

      await cacheCuisineResults(cuisineKey, completeRecipes);
      return completeRecipes;
    } catch (error) {
      console.error('Error filtering recipes by cuisine:', error);
      throw error;
    }
  } else {
    throw new Error('Daily API limit reached.');
  }
};

export const fetchRecipeById = async (id) => {
  if (!id) return null;

  const recipeId = typeof id === 'string' ? parseInt(id) : id;
  const params = {
    includeNutrition: true,
    addRecipeInformation: true,
    fillIngredients: true
  };

  const cachedRecipe = await getCachedRecipe(recipeId);
  if (cachedRecipe && (!cachedRecipe.isStale || isCacheOnlyMode())) {
    console.log(`Using cached recipe for id ${recipeId}`);
    return cachedRecipe;
  }

  if (canMakeApiCall()) {
    try {
      const recipe = await tryApiCallWithFallback(async (api) => {
        const response = await retryRequest(() => api.get(`/recipes/${recipeId}/information`, { params }));
        incrementApiUsage();
        return response.data;
      });

      if (!recipe.extendedIngredients || !recipe.analyzedInstructions) {
        console.error('Received incomplete recipe data from API:', {
          id: recipe.id,
          hasIngredients: !!recipe.extendedIngredients,
          hasInstructions: !!recipe.analyzedInstructions
        });
      }

      await cacheRecipe(recipe);
      return recipe;
    } catch (error) {
      console.error('Error fetching recipe id:', error);
      throw error;
    }
  } else {
    throw new Error('Daily API limit reached.');
  }
};

export const getApiUsageInfo = () => {
  return {
    isLimited: isCacheOnlyMode(),
    ...initApiTracker()
  }
};