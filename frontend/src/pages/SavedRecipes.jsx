import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function SavedRecipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  const fetchSavedRecipes = async () => {
    try {
      const token = user?.token;

      if (!token) throw new Error("You are not logged in.");

      const response = await fetch("http://localhost:8080/user/recipes", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch recipes.");

      const data = await response.json();

      // Normalize ingredient_id (fix $oid issue)
      const parsedRecipes = data.value.map(recipe => ({
        ...recipe,
        items: recipe.items.map(item => ({
          ...item,
          ingredient_id: item.ingredient_id?.$oid || item.ingredient_id
        }))
      }));

      setRecipes(parsedRecipes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading recipes...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

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
        <p>No recipes found.</p>
      ) : (
        <ul className="space-y-4">
          {recipes.map((recipe) => (
            <li key={recipe.recipe_id} className="border p-4 rounded bg-gray-50">
              <h2 className="text-xl font-semibold">{recipe.title}</h2>
              <p>{recipe.description}</p>
              <p>
                <strong>Preparation Time:</strong> {recipe.preparation_time} minutes
              </p>
              <p>
                <strong>Serving Size:</strong> {recipe.serving_size}
              </p>

              <div className="mt-2">
                <h3 className="font-semibold">Items:</h3>
                {recipe.items.map((item, index) => (
                  <p key={index}>
                    {item.quantity} x {item.unit_quantity} {item.unit} {item.name} 
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SavedRecipes;
