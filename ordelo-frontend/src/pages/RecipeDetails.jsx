import { useEffect, useState } from "react";
import axios from "axios";

const SPOONACULAR_API_KEY = "5337e71f5d9743ffad0ad4307681f80c"; 
const RECIPE_DETAILS_URL = "https://api.spoonacular.com/recipes/";

function RecipeDetails({ id, close }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchRecipeDetails = async () => {
      console.log(`📡 Fetching details for Recipe ID: ${id}`);

      try {
        const response = await axios.get(`${RECIPE_DETAILS_URL}${id}/information`, {
          params: { apiKey: SPOONACULAR_API_KEY },
        });

        console.log("✅ API Response:", response.data);
        setRecipe(response.data);
      } catch (error) {
        console.error("❌ Error fetching recipe details:", error);
        setError("Failed to load recipe details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetails();
  }, [id]);

  if (loading) return <p className="text-center text-gray-500 mt-10">Loading recipe...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;
  if (!recipe) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Close Button */}
        <button onClick={close} className="absolute top-2 right-4 text-gray-600 text-xl">✖</button>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <h1 className="text-2xl font-bold text-blue-500">{recipe.title}</h1>

          {/* Recipe Image */}
          <img 
            src={recipe.image || "https://via.placeholder.com/556x370?text=No+Image"} 
            alt={recipe.title} 
            className="w-full rounded-lg mt-4"
          />

          {/* Ingredients */}
          <h2 className="text-xl font-semibold mt-4">Ingredients</h2>
          <ul className="mt-2 space-y-1">
            {recipe.extendedIngredients?.map((ingredient, index) => (
              <li key={index} className="bg-gray-200 p-2 rounded-lg">{ingredient.original}</li>
            ))}
          </ul>

          {/* Instructions */}
          <h2 className="text-xl font-semibold mt-4">Instructions</h2>
          <p className="mt-2">{recipe.instructions || "No instructions available."}</p>

          {/* Link to Full Recipe */}
          <a 
            href={recipe.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            View Full Recipe
          </a>
        </div>
      </div>
    </div>
  );
}

export default RecipeDetails;
