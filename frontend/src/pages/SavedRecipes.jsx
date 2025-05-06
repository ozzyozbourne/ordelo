import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";  // ✅ Import useAuth

function SavedRecipes() {
  const { user } = useAuth();  // ✅ Get user from AuthContext
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editRecipeId, setEditRecipeId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  const fetchSavedRecipes = async () => {
    try {
      const token = user?.token;  // ✅ No more localStorage

      if (!token) throw new Error("You are not logged in.");

      const response = await fetch("http://localhost:8080/user/recipes", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch recipes.");

      const data = await response.json();
      setRecipes(data.recipes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recipeId) => {
    const token = user?.token;

    if (!window.confirm("Are you sure you want to delete this recipe?")) return;

    const response = await fetch("http://localhost:8080/user/recipes", {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipe_id: recipeId }),
    });

    if (response.ok) {
      setRecipes(recipes.filter((r) => r.recipe_id !== recipeId));
    } else {
      alert("Failed to delete recipe");
    }
  };

  const handleEditClick = (recipe) => {
    setEditRecipeId(recipe.recipe_id);
    setEditFormData({
      title: recipe.title,
      description: recipe.description,
      preparation_time: recipe.preparation_time,
      serving_size: recipe.serving_size,
    });
  };

  const handleCancelEdit = () => {
    setEditRecipeId(null);
    setEditFormData({});
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveEdit = async () => {
    const token = user?.token;

    const response = await fetch("http://localhost:8080/user/recipes", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipe_id: editRecipeId,
        ...editFormData,
      }),
    });

    if (response.ok) {
      const updatedRecipes = recipes.map((recipe) =>
        recipe.recipe_id === editRecipeId
          ? { ...recipe, ...editFormData }
          : recipe
      );
      setRecipes(updatedRecipes);
      setEditRecipeId(null);
      setEditFormData({});
    } else {
      alert("Failed to update recipe");
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
              {editRecipeId === recipe.recipe_id ? (
                <div className="space-y-2">
                  <input
                    name="title"
                    value={editFormData.title}
                    onChange={handleEditChange}
                    className="border p-2 w-full"
                    placeholder="Title"
                  />
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditChange}
                    className="border p-2 w-full"
                    placeholder="Description"
                  />
                  <input
                    name="preparation_time"
                    type="number"
                    value={editFormData.preparation_time}
                    onChange={handleEditChange}
                    className="border p-2 w-full"
                    placeholder="Preparation Time"
                  />
                  <input
                    name="serving_size"
                    type="number"
                    value={editFormData.serving_size}
                    onChange={handleEditChange}
                    className="border p-2 w-full"
                    placeholder="Serving Size"
                  />

                  <div className="space-x-2 mt-2">
                    <button onClick={handleSaveEdit} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Save</button>
                    <button onClick={handleCancelEdit} className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500">Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold">{recipe.title}</h2>
                  <p>{recipe.description}</p>
                  <p><strong>Preparation Time:</strong> {recipe.preparation_time} minutes</p>
                  <p><strong>Serving Size:</strong> {recipe.serving_size}</p>

                  <div className="mt-2 space-x-2">
                    <button onClick={() => handleEditClick(recipe)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Edit</button>
                    <button onClick={() => handleDelete(recipe.recipe_id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SavedRecipes;
