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
      [name]: value,
    }));
  };

  const handleIngredientSelect = (e) => {
    const ingredient_id = e.target.value;
    const selectedIngredient = ingredients.find(
      (ing) => ing.ingredient_id === ingredient_id
    );

    if (!selectedIngredient) return;

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
            preparation_time: parseInt(recipe.preparation_time) || 0,
            serving_size: parseInt(recipe.serving_size) || 0,
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
    <div className="add-recipe-container">
      <h1 className="add-recipe-title">Add New Recipe</h1>

      <form onSubmit={handleSubmit} className="add-recipe-form">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={recipe.title}
          onChange={handleChange}
          required
          className="add-recipe-input"
        />

        <textarea
          name="description"
          placeholder="Description"
          value={recipe.description}
          onChange={handleChange}
          required
          className="add-recipe-textarea"
        />

        <div className="recipe-meta-inputs">
          <div className="input-group">
            <label className="input-label">Preparation Time (minutes)</label>
            <input
              type="number"
              name="preparation_time"
              value={recipe.preparation_time}
              onChange={handleChange}
              className="add-recipe-input"
              min="0"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Serving Size</label>
            <input
              type="number"
              name="serving_size"
              value={recipe.serving_size}
              onChange={handleChange}
              className="add-recipe-input"
              min="0"
            />
          </div>
        </div>

        <div className="ingredients-section">
          <h3 className="ingredients-title">Ingredients / Items</h3>

          <div className="ingredient-list">
            {recipe.items.map((item, index) => (
              <div key={index} className="ingredient-item">
                <p>
                  {item.quantity} x {item.unit_quantity} {item.unit} {item.name}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="remove-item-button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="ingredient-controls">
            <select
              value={newItem.ingredient_id}
              onChange={handleIngredientSelect}
              className="ingredient-select"
            >
              <option value="">-- Select Ingredient --</option>
              {ingredients.map((ing) => (
                <option key={ing.ingredient_id} value={ing.ingredient_id}>
                  {ing.name} ({ing.unit_quantity} {ing.unit})
                </option>
              ))}
            </select>

            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={newItem.quantity}
              onChange={handleItemChange}
              className="add-recipe-input"
              min="1"
            />

            <button
              type="button"
              onClick={handleAddItem}
              className="add-item-button"
            >
              Add Item
            </button>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button
          type="submit"
          className="submit-button"
          disabled={loading}
        >
          {loading ? "Adding Recipe..." : "Add Recipe"}
        </button>
      </form>
    </div>
  );
}

export default AddRecipe;