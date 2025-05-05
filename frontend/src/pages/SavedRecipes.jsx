import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function SavedRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSavedRecipes = async () => {
      try {

        const storedUser = JSON.parse(localStorage.getItem("user"));
        const token = storedUser?.token;

        if (!token) {
          throw new Error("You are not logged in.");
        }

        const response = await fetch("http://localhost:8080/user/recipes", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized. Please log in again.");
          } else {
            throw new Error("Failed to fetch recipes.");
          }
        }

        const data = await response.json();

      } catch (err) {
        console.error("Error fetching recipes", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedRecipes();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p>Loading saved recipes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4 text-right">
        <Link
          to="/add-recipe"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add New Recipe
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-4">Saved Recipes</h1>

      {recipes.length === 0 ? (
        <p>No saved recipes found.</p>
      ) : (
        <ul className="space-y-4">
          {recipes.map((recipe) => (
            <li key={recipe.recipe_id} className="border p-4 rounded bg-gray-50">
              <h2 className="text-xl font-semibold">{recipe.title}</h2>
              <p>{recipe.description}</p>
              <p><strong>Serving Size:</strong> {recipe.serving_size}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SavedRecipes;
