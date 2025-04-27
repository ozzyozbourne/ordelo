Ordelo Frontend to Backend Integration Guide
1. API Mappings (Frontend to Backend)
src/context/AuthContext.jsx

Area    Current    What to Change    Backend
login(userData)    Mock admin login    Replace with Axios POST /ordelo/ using { email, password }    POST /ordelo/
logout()    LocalStorage clearing    (Optional) Backend logout API call (future)    N/A
src/context/RecipeContext.jsx

Area    Current    What to Change    Backend
saveRecipe(recipe)    Local favorites save    Replace with POST /ordelo/recipe/{user_id}    POST /ordelo/recipe/{user_id}
loadRandomRecipes()    Spoonacular API    Keep using Spoonacular    N/A
searchForRecipes(query)    Spoonacular API search    Keep using Spoonacular    N/A
src/context/ShoppingContext.jsx

Area    Current    What to Change    Backend
addToCart(item)    Local add to cart    Replace with POST /ordelo/cart/{user_id}    POST /ordelo/cart/{user_id}
removeFromCart(item)    Local remove    Replace with DELETE /ordelo/cart/{user_id}    DELETE /ordelo/cart/{user_id}
fetchCart()    No real fetch    Implement GET /ordelo/cart/{user_id}    GET /ordelo/cart/{user_id}
src/pages/Home.jsx

Area    Current    What to Change    Backend
Search Recipes    Spoonacular Search    Keep using Spoonacular    N/A
Fetch Random Recipes    Spoonacular    Keep using Spoonacular    N/A
Add Recipe (Upload)    Local handling    Submit to backend POST /ordelo/recipe/{user_id}    POST /ordelo/recipe/{user_id}
src/pages/SavedRecipes.jsx

Area    Current    What to Change    Backend
Load Saved Recipes    Local array    Fetch from backend GET /ordelo/recipe/{user_id}    GET /ordelo/recipe/{user_id}
Delete Saved Recipe    Local deletion    Delete from backend DELETE /ordelo/recipe/{user_id}    DELETE /ordelo/recipe/{user_id}
src/pages/ShoppingPage.jsx

Area    Current    What to Change    Backend
Load Shopping List    Local state    Fetch from backend GET /ordelo/cart/{user_id}    GET /ordelo/cart/{user_id}
Remove Cart Item    Local remove    Backend delete    DELETE /ordelo/cart/{user_id}
Checkout    Simulate order    Backend place order POST /ordelo/order/{user_id}    POST /ordelo/order/{user_id}
src/pages/Orders.jsx

Area    Current    What to Change    Backend
View Orders    Mock orders    Fetch real orders GET /ordelo/order/{user_id}/{order_id}    GET /ordelo/order/{user_id}/{order_id}
Cancel Order    Local delete    Backend delete order DELETE /ordelo/order/{user_id}/{order_id}    DELETE /ordelo/order/{user_id}/{order_id}
src/pages/ProfilePage.jsx

Area    Current    What to Change    Backend
Fetch User Info    Static mock user    Fetch real profile GET /ordelo/{user_id}    GET /ordelo/{user_id}
Update Profile Info    Local update    Update profile PUT /ordelo/{user_id}    PUT /ordelo/{user_id}
src/components/RecipeCard.jsx

Area    Current    What to Change    Backend
Save Recipe Button    Local toggle    Save to backend POST /ordelo/recipe/{user_id}    POST /ordelo/recipe/{user_id}
Select Ingredients Button    Local selection    Post selected ingredients to cart    POST /ordelo/cart/{user_id}
2. Centralized Axios API Setup
Create file ➔ src/services/api.js

javascript
Copy
Edit
// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

API.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized - token may be expired');
    }
    return Promise.reject(error);
  }
);

export default API;
3. Migration Plan - Feature by Feature

Step    Feature    What To Do
1    Authentication    Replace login function to connect with POST /ordelo/
2    Profile    Fetch and update user profile with GET/PUT /ordelo/{user_id}
3    Saved Recipes    Fetch and manage saved recipes via GET/POST/DELETE /ordelo/recipe/{user_id}
4    Shopping Cart    Fetch cart, add/remove items via /ordelo/cart/{user_id}
5    Orders    Place and manage orders via /ordelo/order/{user_id}
6    Vendor Dashboard    Connect vendor store and orders with /ordelo/vendor/{vendor_id}
7    Admin Dashboard    Connect Admin Ingredient and User Management with backend
8    Final Cleanup    Remove mock data files after full testing
