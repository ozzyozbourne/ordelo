import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecipes } from "../context/RecipeContext";

function AddRecipe() {
  const navigate = useNavigate();
  const { showToast } = useRecipes();

  const [recipe, setRecipe] = useState({
    title: "",
    description: "",
    servings: 2,
    prepTime: 15,
    cookTime: 30,
    ingredients: [],
    instructions: [""],
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRecipe({ ...recipe, [name]: value });
  };

  const handleServingsChange = (value) => {
    if (value >= 1 && value <= 20) {
      setRecipe({ ...recipe, servings: value });
    }
  };

  const handleInstructionChange = (index, value) => {
    const updated = [...recipe.instructions];
    updated[index] = value;
    setRecipe({ ...recipe, instructions: updated });
  };

  const addInstruction = () => {
    setRecipe({ ...recipe, instructions: [...recipe.instructions, ""] });
  };

  const removeInstruction = (index) => {
    const updated = [...recipe.instructions];
    updated.splice(index, 1);
    setRecipe({ ...recipe, instructions: updated });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const discardRecipe = () => {
    if (window.confirm("Are you sure to discard this recipe?")) {
      navigate("/");
    }
  };

  const submitRecipe = (e) => {
    e.preventDefault();

    if (!recipe.title.trim()) {
      showToast("Please add a recipe title", "error");
      return;
    }

    if (recipe.ingredients.length === 0) {
      showToast("Please add at least one ingredient", "error");
      return;
    }

    if (recipe.instructions.some((i) => !i.trim())) {
      showToast("Please fill in all instruction steps", "error");
      return;
    }

    const payload = {
      title: recipe.title,
      description: recipe.description,
      serving_size: recipe.servings,
      preparation_time: recipe.prepTime,
      items: recipe.ingredients.map((item) => ({
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
      })),
      instructions: recipe.instructions,
    };

    console.log("Submitting Recipe:", payload);
    showToast("Recipe submitted successfully!", "success");
    navigate("/");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Add Recipe</h1>

      <form onSubmit={submitRecipe} className="space-y-6">
        <div>
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={recipe.title}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
            required
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            name="description"
            value={recipe.description}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
          />
        </div>

        <div className="flex space-x-4">
          <div>
            <label>Servings</label>
            <input
              type="number"
              min="1"
              max="20"
              value={recipe.servings}
              onChange={(e) => handleServingsChange(parseInt(e.target.value))}
              className="border p-2 rounded w-20"
            />
          </div>

          <div>
            <label>Prep Time (mins)</label>
            <input
              type="number"
              name="prepTime"
              value={recipe.prepTime}
              onChange={handleInputChange}
              className="border p-2 rounded w-20"
            />
          </div>

          <div>
            <label>Cook Time (mins)</label>
            <input
              type="number"
              name="cookTime"
              value={recipe.cookTime}
              onChange={handleInputChange}
              className="border p-2 rounded w-20"
            />
          </div>
        </div>

        <div>
          <label>Ingredients</label>
  

          <ul className="space-y-2">
            {recipe.ingredients.map((item, index) => (
              <li key={index} className="flex items-center space-x-4 border p-2 rounded bg-gray-50">
                <span>
                  {item.name} ({item.unit}) - {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...recipe.ingredients];
                    updated.splice(index, 1);
                    setRecipe({ ...recipe, ingredients: updated });
                  }}
                  className="text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label>Instructions</label>
          {recipe.instructions.map((inst, index) => (
            <div key={index} className="flex space-x-2 items-start">
              <textarea
                value={inst}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                className="border p-2 rounded w-full"
              />
              <button
                type="button"
                onClick={() => removeInstruction(index)}
                disabled={recipe.instructions.length === 1}
                className="text-red-500"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addInstruction}
            className="mt-2 text-blue-500"
          >
            Add Step
          </button>
        </div>

        <div>
          <label>Recipe Image</label>
          <input type="file" onChange={handleImageChange} className="border p-2 rounded w-full" />
          {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 rounded" />}
        </div>

        <div className="flex space-x-4">
          <button type="button" onClick={discardRecipe} className="bg-gray-400 text-white px-4 py-2 rounded">
            Discard
          </button>
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
            Submit Recipe
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddRecipe;
