import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/AddRecipe.css"; // Import the CSS file

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
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchIngredients();
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

  const handleAddItem = () => {
    if (!selectedIngredient || !quantity) {
      setError("Please select an ingredient and enter a quantity");
      return;
    }

    const ingredientToAdd = ingredients.find(
      (ing) => ing.ingredient_id === selectedIngredient
    );

    if (!ingredientToAdd) return;

    setRecipe((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ingredient_id: ingredientToAdd.ingredient_id,
          name: ingredientToAdd.name,
          price: ingredientToAdd.price,
          unit_quantity: ingredientToAdd.unit_quantity,
          unit: ingredientToAdd.unit,
          quantity: parseInt(quantity),
        },
      ],
    }));

    // Reset selection and quantity
    setSelectedIngredient("");
    setQuantity("");
    setError(null);
    // Show brief success message for ingredient add
    setSuccess("Ingredient added!");
    setTimeout(() => setSuccess(false), 2000);
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

      <form className="add-recipe-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Recipe Title</label>
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={recipe.title}
            onChange={handleChange}
            required
            className="add-recipe-input"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Description</label>
          <textarea
            name="description"
            placeholder="Description"
            value={recipe.description}
            onChange={handleChange}
            required
            className="add-recipe-textarea"
          />
        </div>

        <div className="recipe-meta-inputs">
          <div className="input-group">
            <label className="input-label">Preparation Time (minutes)</label>
            <input
              type="number"
              name="preparation_time"
              placeholder="Preparation Time"
              value={recipe.preparation_time}
              onChange={handleChange}
              min="0"
              className="add-recipe-input"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Serving Size</label>
            <input
              type="number"
              name="serving_size"
              placeholder="Serving Size"
              value={recipe.serving_size}
              onChange={handleChange}
              min="0"
              className="add-recipe-input"
            />
          </div>
        </div>

        <div className="addingredients-section">
          <h3 className="ingredients-title">
            <i className="fas fa-utensils"></i> Ingredients
          </h3>

          {recipe.items.length > 0 ? (
            <div className="ingredient-list">
              {recipe.items.map((item, index) => (
                <div key={index} className="ingredient-item">
                  <div className="ingredient-info">
                    <span className="ingredient-name">{item.name}</span>
                    <span className="ingredient-quantity">
                      {item.quantity} × {item.unit_quantity} {item.unit}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="remove-item-button"
                  >
                    <i className="fas fa-times"></i> Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-ingredient-list">
              <p>No ingredients added yet. Add ingredients below.</p>
            </div>
          )}

          <div className="ingredient-controls">
            <h4 className="ingredient-add-title">Add Ingredients</h4>
            <div className="ingredient-selection">
              <div className="input-group">
                <label className="input-label">Select Ingredient</label>
                <select
                  value={selectedIngredient}
                  onChange={(e) => setSelectedIngredient(e.target.value)}
                  className="add-recipe-input"
                >
                  <option value="">-- Select an ingredient --</option>
                  {ingredients.map((ing) => (
                    <option key={ing.ingredient_id} value={ing.ingredient_id}>
                      {ing.name} ({ing.unit_quantity} {ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  placeholder="Enter quantity"
                  className="add-recipe-input"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="add-item-button"
              >
                <i className="fas fa-plus"></i> Add Ingredient
              </button>
            </div>
          </div>
          
          {success && <p className="success-message"><i className="fas fa-check-circle"></i> {success}</p>}
        </div>

        {error && (
          <p className="error-message">
            <i className="fas fa-exclamation-circle"></i> {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? (
            <>
              <span className="loading-indicator"></span> Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i> Save Recipe
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default AddRecipe;