// src/utils/apiUtils.js
// API request optimization utilities

// In-memory pending requests cache to prevent duplicate requests
const pendingRequests = {};

// Create a request key based on url and parameters
const createRequestKey = (url, params) => {
  return `${url}:${JSON.stringify(params || {})}`;
};

// Debounce function for input handlers
export const debounce = (func, delay = 300) => {
  let timer;
  
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// Throttle function to limit how often a function can be called
export const throttle = (func, limit = 300) => {
  let inThrottle;
  
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

// Function to deduplicate API requests
export const dedupeRequest = (axiosInstance, requestConfig) => {
  const { url, params } = requestConfig;
  const requestKey = createRequestKey(url, params);
  
  // If this exact request is already in progress, return its promise
  if (pendingRequests[requestKey]) {
    console.log(`Request deduplication: Using existing request for ${url}`);
    return pendingRequests[requestKey];
  }
  
  // Make the request and store its promise
  const requestPromise = axiosInstance(requestConfig)
    .then(response => {
      // Remove from pending requests when done
      delete pendingRequests[requestKey];
      return response;
    })
    .catch(error => {
      // Remove from pending requests on error
      delete pendingRequests[requestKey];
      throw error;
    });
  
  // Store the promise
  pendingRequests[requestKey] = requestPromise;
  
  return requestPromise;
};

// Create a network status detector
export const createNetworkDetector = () => {
  const isOnline = () => navigator.onLine;
  
  const onNetworkChange = (callback) => {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
    
    // Return the remove function
    return () => {
      window.removeEventListener('online', () => callback(true));
      window.removeEventListener('offline', () => callback(false));
    };
  };
  
  return {
    isOnline,
    onNetworkChange
  };
};

// Retry failed API requests with exponential backoff
export const retryRequest = async (requestFunc, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFunc();
    } catch (error) {
      console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error;
      
      // Wait with exponential backoff before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
    }
  }
  
  throw lastError;
};

// Create an enhanced axios instance with all optimizations
export const createOptimizedAxios = (axiosInstance) => {
  return {
    get: (url, config = {}) => dedupeRequest(axiosInstance, { url, method: 'get', ...config }),
    post: (url, data, config = {}) => dedupeRequest(axiosInstance, { url, method: 'post', data, ...config }),
    put: (url, data, config = {}) => dedupeRequest(axiosInstance, { url, method: 'put', data, ...config }),
    delete: (url, config = {}) => dedupeRequest(axiosInstance, { url, method: 'delete', ...config }),
    // Add other methods as needed
  };
};
