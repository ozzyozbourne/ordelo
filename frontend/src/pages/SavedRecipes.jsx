import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRecipes } from "../context/RecipeContext";

function SavedRecipes() {
  const { user } = useAuth();
  const { addToShoppingList } = useRecipes();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecipes, setSelectedRecipes] = useState([]);

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

  const toggleRecipeSelection = (recipeId) => {
    setSelectedRecipes(prev => {
      if (prev.includes(recipeId)) {
        return prev.filter(id => id !== recipeId);
      } else {
        return [...prev, recipeId];
      }
    });
  };

  const handleGenerateShoppingList = () => {
    if (selectedRecipes.length === 0) {
      setError("Please select at least one recipe");
      return;
    }

    const selectedRecipeItems = recipes
      .filter(recipe => selectedRecipes.includes(recipe.recipe_id))
      .flatMap(recipe => recipe.items.map(item => ({
        id: item.ingredient_id,
        name: item.name,
        amount: item.quantity,
        unit: item.unit,
        unit_quantity: item.unit_quantity,
        price: item.price
      })));

    // Merge similar ingredients
    const mergedIngredients = selectedRecipeItems.reduce((acc, item) => {
      const key = `${item.name?.toLowerCase() || ''}-${item.unit || ''}`;
      if (!acc[key]) {
        acc[key] = { ...item };
      } else {
        acc[key].amount += item.amount;
      }
      return acc;
    }, {});

    addToShoppingList(Object.values(mergedIngredients));
    navigate('/shopping-list');
  };

  if (loading) return <p>Loading recipes...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <Link
          to="/add-recipe"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add New Recipe
        </Link>
        {recipes.length > 0 && (
          <button
            onClick={handleGenerateShoppingList}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={selectedRecipes.length === 0}
          >
            Generate Shopping List ({selectedRecipes.length} selected)
          </button>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-4">Saved Recipes</h1>

      {recipes.length === 0 ? (
        <p>No recipes found.</p>
      ) : (
        <ul className="space-y-4">
          {recipes.map((recipe) => (
            <li 
              key={recipe.recipe_id} 
              className={`border p-4 rounded bg-gray-50 cursor-pointer transition-colors ${
                selectedRecipes.includes(recipe.recipe_id) ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => toggleRecipeSelection(recipe.recipe_id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{recipe.title}</h2>
                  <p>{recipe.description}</p>
                  <p>
                    <strong>Preparation Time:</strong> {recipe.preparation_time} minutes
                  </p>
                  <p>
                    <strong>Serving Size:</strong> {recipe.serving_size}
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedRecipes.includes(recipe.recipe_id)}
                    onChange={() => toggleRecipeSelection(recipe.recipe_id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 text-blue-500"
                  />
                </div>
              </div>

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
