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
    ingredients: [{ name: "", amount: "", unit: "" }],
    instructions: [""]
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
  
  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...recipe.ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    setRecipe({ ...recipe, ingredients: updatedIngredients });
  };
  
  const handleInstructionChange = (index, value) => {
    const updatedInstructions = [...recipe.instructions];
    updatedInstructions[index] = value;
    setRecipe({ ...recipe, instructions: updatedInstructions });
  };
  
  const addIngredient = () => {
    setRecipe({
      ...recipe,
      ingredients: [...recipe.ingredients, { name: "", amount: "", unit: "" }]
    });
  };
  
  const removeIngredient = (index) => {
    if (recipe.ingredients.length > 1) {
      const updatedIngredients = [...recipe.ingredients];
      updatedIngredients.splice(index, 1);
      setRecipe({ ...recipe, ingredients: updatedIngredients });
    }
  };
  
  const addInstruction = () => {
    setRecipe({
      ...recipe,
      instructions: [...recipe.instructions, ""]
    });
  };
  
  const removeInstruction = (index) => {
    if (recipe.instructions.length > 1) {
      const updatedInstructions = [...recipe.instructions];
      updatedInstructions.splice(index, 1);
      setRecipe({ ...recipe, instructions: updatedInstructions });
    }
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
  
  const submitRecipe = (e) => {
    e.preventDefault();
    
    // Validation
    if (!recipe.title.trim()) {
      showToast("Please add a recipe title", "error");
      return;
    }
    
    if (recipe.ingredients.some(ing => !ing.name.trim())) {
      showToast("Please fill in all ingredient names", "error");
      return;
    }
    
    if (recipe.instructions.some(inst => !inst.trim())) {
      showToast("Please fill in all instruction steps", "error");
      return;
    }
    
    // In a real app, submit to API/database
    showToast("Recipe submitted successfully!", "success");
    navigate("/");
  };
  
  const discardRecipe = () => {
    if (window.confirm("Are you sure you want to discard this recipe? All your changes will be lost.")) {
      navigate("/");
    }
  };
  
  return (
    <div className="add-recipe-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">
            <i className="fas fa-plus-circle"></i> Add Your Recipe
          </h1>
          <p className="page-description">
            Share your culinary creation with the Ordelo community.
          </p>
        </div>
      </div>
      
      <div className="container">
        <form className="recipe-form" onSubmit={submitRecipe}>
          <div className="form-grid">
            <div className="form-left">
              <div className="form-section">
                <h2 className="form-section-title">Basic Information</h2>
                
                <div className="form-group">
                  <label htmlFor="recipe-title">Recipe Title</label>
                  <input
                    type="text"
                    id="recipe-title"
                    name="title"
                    value={recipe.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Homemade Margherita Pizza"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="recipe-description">Description</label>
                  <textarea
                    id="recipe-description"
                    name="description"
                    value={recipe.description}
                    onChange={handleInputChange}
                    placeholder="Describe your recipe in a few sentences..."
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="recipe-servings">Servings</label>
                    <div className="quantity-input">
                      <button 
                        type="button" 
                        className="quantity-btn"
                        onClick={() => handleServingsChange(recipe.servings - 1)}
                        disabled={recipe.servings <= 1}
                      >
                        <i className="fas fa-minus"></i>
                      </button>
                      <input 
                        type="number" 
                        id="recipe-servings"
                        value={recipe.servings}
                        onChange={(e) => handleServingsChange(parseInt(e.target.value) || 1)}
                        min="1"
                        max="20"
                      />
                      <button 
                        type="button" 
                        className="quantity-btn"
                        onClick={() => handleServingsChange(recipe.servings + 1)}
                        disabled={recipe.servings >= 20}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="recipe-prep-time">Prep Time (minutes)</label>
                    <input
                      type="number"
                      id="recipe-prep-time"
                      name="prepTime"
                      value={recipe.prepTime}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="recipe-cook-time">Cook Time (minutes)</label>
                    <input
                      type="number"
                      id="recipe-cook-time"
                      name="cookTime"
                      value={recipe.cookTime}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h2 className="form-section-title">Recipe Image</h2>
                
                <div className="image-upload-container">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Recipe preview" />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <p>Click to upload an image</p>
                      <span>or drag and drop</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="recipe-image" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="image-input"
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h2 className="form-section-title">Ingredients</h2>
                
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="ingredient-row">
                    <div className="ingredient-inputs">
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Amount"
                        value={ingredient.amount}
                        onChange={(e) => handleIngredientChange(index, "amount", e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, "unit", e.target.value)}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="remove-item-btn"
                      onClick={() => removeIngredient(index)}
                      disabled={recipe.ingredients.length === 1}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
                
                <button 
                  type="button" 
                  className="add-item-btn"
                  onClick={addIngredient}
                >
                  <i className="fas fa-plus"></i> Add Ingredient
                </button>
              </div>
            </div>
            
            <div className="form-right">
              <div className="form-section">
                <h2 className="form-section-title">Instructions</h2>
                
                {recipe.instructions.map((instruction, index) => (
                  <div key={index} className="instruction-row">
                    <div className="instruction-number">{index + 1}</div>
                    <textarea
                      placeholder={`Step ${index + 1}`}
                      value={instruction}
                      onChange={(e) => handleInstructionChange(index, e.target.value)}
                      rows="2"
                      required
                    ></textarea>
                    <button 
                      type="button" 
                      className="remove-item-btn"
                      onClick={() => removeInstruction(index)}
                      disabled={recipe.instructions.length === 1}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
                
                <button 
                  type="button" 
                  className="add-item-btn"
                  onClick={addInstruction}
                >
                  <i className="fas fa-plus"></i> Add Step
                </button>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={discardRecipe}
            >
              <i className="fas fa-times"></i> Discard
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              <i className="fas fa-check"></i> Submit Recipe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRecipe;