// src/components/SelectedIngredientsPanel.jsx
import { useShoppingContext } from "../context/ShoppingContext";

function SelectedIngredientsPanel() {
  const { 
    selectedIngredients, 
    toggleIngredientSelection,
    showIngredientsPanel,
    setShowIngredientsPanel 
  } = useShoppingContext();

  return (
    <div className="selected-ingredients-panel">
      <div className="panel-header sticky-header">
        <h2>Ingredients</h2>
        <span className="ingredient-count">{selectedIngredients.filter(i => i.selected).length}</span>
      </div>
      
      <div className="ingredients-list scrollable-content">
        {selectedIngredients.map((ingredient) => (
          <div 
            key={ingredient.id || ingredient.uniqueId} 
            className={`ingredient-item ${ingredient.selected ? 'selected' : ''}`}
            onClick={() => toggleIngredientSelection(ingredient.id || ingredient.uniqueId)}
          >
            <div className="ingredient-info">
              <span className="ingredient-name">{ingredient.name}</span>
              {ingredient.amount && (
                <span className="ingredient-amount">
                  {ingredient.amount} {ingredient.unit || ''}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelectedIngredientsPanel;