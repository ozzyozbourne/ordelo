// src/services/apiTracker.js
// Track API usage and apply limits

// Constants
const STORAGE_KEY = 'spoonacular_api_usage';
const DAILY_LIMIT = 500; // Set slightly below actual limit (150) for safety
const CACHE_ONLY_THRESHOLD = 450; // Switch to cache-only mode at this threshold

// Get the current date as a string (YYYY-MM-DD)
const getCurrentDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// Initialize API usage tracker
export const initApiTracker = () => {
  // Check if we have an entry for today
  const usage = getApiUsage();
  const today = getCurrentDate();
  
  if (usage.date !== today) {
    // Reset counter for new day
    setApiUsage({
      date: today,
      count: 0,
      cacheOnlyMode: false,
      lastReset: Date.now()
    });
    
    return {
      date: today,
      count: 0,
      cacheOnlyMode: false
    };
  }
  
  return usage;
};

// Get current API usage
export const getApiUsage = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return {
      date: getCurrentDate(),
      count: 0,
      cacheOnlyMode: false,
      lastReset: Date.now()
    };
  }
  
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing API usage data:', e);
    return {
      date: getCurrentDate(),
      count: 0,
      cacheOnlyMode: false,
      lastReset: Date.now()
    };
  }
};
// Set API usage
export const setApiUsage = (usage) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
};
// Increment API usage counter
export const incrementApiUsage = (count = 1) => {
  const usage = getApiUsage();
  const today = getCurrentDate();
  
  // If date has changed, reset the counter
  if (usage.date !== today) {
    const newUsage = {
      date: today,
      count,
      cacheOnlyMode: false,
      lastReset: Date.now()
    };
    setApiUsage(newUsage);
    return newUsage;
  }
  
  // Update counter
  const newCount = usage.count + count;
  const cacheOnlyMode = newCount >= CACHE_ONLY_THRESHOLD;
  // If we've moved into cache-only mode, log it
  if (cacheOnlyMode && !usage.cacheOnlyMode) {
    console.warn(`API daily limit approaching (${newCount}/${DAILY_LIMIT}). Switching to cache-only mode.`);
  }
  
  const newUsage = {
    ...usage,
    count: newCount,
    cacheOnlyMode
  };
  
  setApiUsage(newUsage);
  return newUsage;
};

// Check if we can make an API call
export const canMakeApiCall = () => {
  const usage = initApiTracker();
  return !usage.cacheOnlyMode && usage.count < DAILY_LIMIT;
};

// Get remaining API calls for the day
export const getRemainingApiCalls = () => {
  const usage = initApiTracker();
  return Math.max(0, DAILY_LIMIT - usage.count);
};

// Force reset API counter (use with caution, primarily for testing)
export const resetApiCounter = () => {
  setApiUsage({
    date: getCurrentDate(),
    count: 0,
    cacheOnlyMode: false,
    lastReset: Date.now()
  });
};

// Get cache-only mode status
export const isCacheOnlyMode = () => {
  const usage = initApiTracker();
  return usage.cacheOnlyMode;
};
