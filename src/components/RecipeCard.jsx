import { Link } from "react-router-dom";
import { useState } from "react";

function RecipeCard({ recipe, onSave, isSaved }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="recipe-card" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="recipe-image-container" style={{ position: 'relative' }}>
        <img 
          src={recipe.image || '/src/assets/placeholder-food.jpg'} 
          alt={recipe.title} 
          className="recipe-image" 
        />
        {isHovered && (
          <div className="recipe-card-overlay">
            <Link to={`/recipe/${recipe.id}`} className="btn btn-primary view-recipe-btn">
              <i className="fas fa-eye"></i> View
            </Link>
          </div>
        )}
      </div>
      
      <div className="recipe-content">
        <h3 className="recipe-title">{recipe.title}</h3>
        
        <div className="recipe-meta">
          <span>
            <i className="far fa-clock"></i> {recipe.readyInMinutes || '30'} min
          </span>
          <span>
            <i className="fas fa-fire"></i> {recipe.calories || '400'} cal
          </span>
        </div>
        
        <div className="recipe-buttons">
          <button 
            className={`btn ${isSaved ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => onSave(recipe)}
            aria-label={isSaved ? "Remove from saved" : "Save recipe"}
          >
            <i className={`${isSaved ? 'fas' : 'far'} fa-heart`}></i>
            {isSaved ? ' Saved' : ' Save'}
          </button>
          
          <button className="btn btn-secondary" aria-label="Add to shopping list">
            <i className="fas fa-shopping-basket"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecipeCard;