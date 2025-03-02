import { useState } from "react";
import axios from "axios";

const SPOONACULAR_API_KEY = "5337e71f5d9743ffad0ad4307681f80c";
const SPOONACULAR_RECIPE_URL = "https://api.spoonacular.com/recipes/autocomplete"; // ✅ API for suggestions

function Recipes({ onSelectRecipe }) {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [suggestions, setSuggestions] = useState([]); // ✅ Store live suggestions

  // ✅ Fetch live suggestions as user types
  const fetchSuggestions = async (text) => {
    if (!text) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(SPOONACULAR_RECIPE_URL, {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          query: text,
          number: 5, // Limit results
        },
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  // ✅ Fetch full recipes when searching
  const searchRecipes = async () => {
    if (!query) return;

    try {
      const response = await axios.get("https://api.spoonacular.com/recipes/complexSearch", {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          query: query,
          number: 6,
        },
      });
      setRecipes(response.data.results);
      setSuggestions([]); // ✅ Clear suggestions after search
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  };

  return (
    <div className="p-8 pt-40 min-h-screen bg-gray-100 relative">
      <h1 className="text-4xl font-bold text-blue-500 text-center">Search Recipes</h1>
      <p className="text-lg text-center mt-2">Find delicious recipes using Spoonacular API.</p>

      {/* ✅ Search Input & Suggestions */}
      <div className="mt-6 flex justify-center">
        <div className="relative w-1/2">
          <input
            type="text"
            placeholder="Search for a recipe..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              fetchSuggestions(e.target.value); // ✅ Fetch suggestions as user types
            }}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* ✅ Suggestions Dropdown - Aligns with input */}
          {suggestions.length > 0 && (
            <ul className="absolute w-full bg-white shadow-md rounded-lg mt-1 z-50 border border-gray-300">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  onClick={() => {
                    setQuery(suggestion.title);
                    setSuggestions([]); // ✅ Hide suggestions when clicked
                  }}
                  className="p-3 hover:bg-gray-200 cursor-pointer"
                >
                  {suggestion.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={searchRecipes}
          className="ml-4 bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Recipe Results */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div 
            key={recipe.id} 
            onClick={() => onSelectRecipe(recipe.id)} // ✅ Open details overlay
            className="bg-white p-4 shadow-md rounded-lg hover:shadow-xl transition cursor-pointer"
          >
            <img 
              src={recipe.image} 
              alt={recipe.title} 
              className="w-full h-40 object-cover rounded-lg"
            />
            <h3 className="text-xl font-bold mt-3">{recipe.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Recipes;
