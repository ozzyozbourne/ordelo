// src/services/spoonacularApi.js
/*  'd4fee4ecdd054ec9b843a94a50133d0d',
  'cf36d70a161f4e6ab5dc3ebd810bbeb6'*/

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

const API_BASE_URL = 'https://api.spoonacular.com';
const API_KEYS = [
  
  'e5417c0a2e4c4fca8b644c983f8327ee',
  '5337e71f5d9743ffad0ad4307681f80c'
];

const createSpoonacularAxios = (apiKey) => {
  return axios.create({
    baseURL: API_BASE_URL,
    params: { apiKey }
  });
};

const tryApiCallWithFallback = async (apiCallFunction) => {
  for (const apiKey of API_KEYS) {
    try {
      const spoonacularAxios = createSpoonacularAxios(apiKey);
      const optimizedAxios = createOptimizedAxios(spoonacularAxios);
      const result = await apiCallFunction(optimizedAxios);
      return result;
    } catch (error) {
      console.warn(`API call failed with key ${apiKey}:`, error.message);
      continue;
    }
  }
  throw new Error('All Spoonacular API keys have failed');
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
    number: 100,
    addRecipeInformation: true,
    fillIngredients: true
  };

  if (isCacheOnlyMode()) {
    const cachedRecipe = await getCachedRecipe('random');
    if (cachedRecipe?.results) {
      console.log('Using cached random recipes (cache-only mode)');
      return cachedRecipe.results;
    }
  }

  if (canMakeApiCall()) {
    try {
      const recipes = await tryApiCallWithFallback(async (api) => {
        const response = await retryRequest(() => api.get('/recipes/random', { params }));
        incrementApiUsage();
        return response.data.recipes;
      });

      await Promise.all(recipes.map(recipe => cacheRecipe(recipe)));
      await cacheRecipe({ id: 'random', results: recipes, timestamp: Date.now() });

      return recipes;
    } catch (error) {
      console.error('Error fetching random recipes:', error);
      throw error;
    }
  } else {
    throw new Error('Daily API limit reached.');
  }
};

export const searchRecipes = async (query) => {
  if (!query) return [];

  const searchQuery = query.toLowerCase().trim();
  const params = {
    query: searchQuery,
    number: 100,
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
    number: 100,
    addRecipeInformation: true
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
        return response.data.results;
      });

      await cacheCuisineResults(cuisineKey, recipes);
      return recipes;
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
  const params = { includeNutrition: true };

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
