import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AddRecipe() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState({
    title: "",
    description: "",
    preparation_time: 0,
    serving_size: 0,
    items: [],
  });
  const [newItem, setNewItem] = useState({ ingredient_id: "", quantity: "" });
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await fetchIngredients();
    })();
  }, []);

  const fetchIngredients = async () => {
    try {
      const token = user?.token;

      const response = await fetch("http://localhost:8080/user/ingredients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch ingredients");

      const data = await response.json();
      const parsedIngredients = JSON.parse(data.message);

      setIngredients(parsedIngredients || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setRecipe((prev) => ({
      ...prev,
      [name]:
        name === "preparation_time" || name === "serving_size"
          ? value
          : value,
    }));
  };

  const handleIngredientSelect = (ingredient_id) => {
    const selectedIngredient = ingredients.find(
      (ing) => ing.ingredient_id === ingredient_id
    );

    setNewItem({
      ingredient_id,
      name: selectedIngredient.name,
      price: selectedIngredient.price,
      unit_quantity: selectedIngredient.unit_quantity,
      unit: selectedIngredient.unit,
      quantity: "",
    });
  };

  const handleItemChange = (e) => {
    setNewItem((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddItem = () => {
    if (!newItem.ingredient_id || !newItem.quantity) return;

    setRecipe((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ingredient_id: newItem.ingredient_id,
          name: newItem.name,
          price: newItem.price,
          unit_quantity: newItem.unit_quantity,
          unit: newItem.unit,
          quantity: parseInt(newItem.quantity),
        },
      ],
    }));

    setNewItem({ ingredient_id: "", quantity: "" });
  };

  const handleRemoveItem = (index) => {
    setRecipe((prev) => {
      const updatedItems = [...prev.items];
      updatedItems.splice(index, 1);
      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = user?.token;

      if (recipe.items.length === 0) {
        throw new Error("Please add at least one item to recipe");
      }

      const payload = {
        recipes: [
          {
            title: recipe.title,
            description: recipe.description,
            preparation_time: parseInt(recipe.preparation_time) || 0, // FIXED
            serving_size: parseInt(recipe.serving_size) || 0,         // FIXED
            items: recipe.items.map((item) => ({
              ingredient_id: { $oid: item.ingredient_id },
              name: item.name,
              price: item.price,
              unit_quantity: item.unit_quantity,
              unit: item.unit,
              quantity: item.quantity,
            })),
          },
        ],
      };

      const response = await fetch("http://localhost:8080/user/recipes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to add recipe");
      }

      navigate("/saved-recipes");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add New Recipe</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={recipe.title}
          onChange={handleChange}
          required
          className="border p-2 w-full"
        />

        <textarea
          name="description"
          placeholder="Description"
          value={recipe.description}
          onChange={handleChange}
          required
          className="border p-2 w-full"
        />

        <input
          type="number"
          name="preparation_time"
          placeholder="Preparation Time (minutes)"
          value={recipe.preparation_time}
          onChange={handleChange}
          className="border p-2 w-full"
          min="0"
        />

        <input
          type="number"
          name="serving_size"
          placeholder="Serving Size"
          value={recipe.serving_size}
          onChange={handleChange}
          className="border p-2 w-full"
          min="0"
        />

        <div>
          <h3 className="font-semibold mt-4 mb-2">Ingredients / Items</h3>

          {recipe.items.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <p>
                {item.quantity} x {item.unit_quantity} {item.unit} {item.name} (${item.price?.toFixed(2)})
              </p>
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="mb-4">
            <h4 className="mb-2">Select Ingredient</h4>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing) => (
                <button
                  key={ing.ingredient_id}
                  type="button"
                  onClick={() => handleIngredientSelect(ing.ingredient_id)}
                  className={`px-3 py-1 rounded border ${
                    newItem.ingredient_id === ing.ingredient_id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {ing.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-2 mb-2 mt-2">
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={newItem.quantity}
              onChange={handleItemChange}
              className="border p-2 w-full"
              min="0"
            />

            <button
              type="button"
              onClick={handleAddItem}
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
            >
              Add Item
            </button>
          </div>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          {loading ? "Saving..." : "Save Recipe"}
        </button>
      </form>
    </div>
  );
}

export default AddRecipe;
