import { useShoppingContext } from "../context/ShoppingContext";

function SelectedIngredientsPanel() {
  const { 
    selectedIngredients, 
    toggleIngredientSelection,
    showIngredientsPanel,
    setShowIngredientsPanel 
  } = useShoppingContext();

  // Standardize function
  const standardizeUnit = (amount, unit) => {
    let unitQuantity = Math.round(amount || 1);
    let standardizedUnit = (unit || '').toLowerCase().trim();
    const unitMappings = {
      'kg': { factor: 1000, unit: 'gm' },
      'kgs': { factor: 1000, unit: 'gm' },
      'g': { factor: 1, unit: 'gm' },
      'gram': { factor: 1, unit: 'gm' },
      'grams': { factor: 1, unit: 'gm' },
      'oz': { factor: 28.35, unit: 'gm' },
      'ounce': { factor: 28.35, unit: 'gm' },
      'ounces': { factor: 28.35, unit: 'gm' },
      'lb': { factor: 453.592, unit: 'gm' },
      'pound': { factor: 453.592, unit: 'gm' },
      'pounds': { factor: 453.592, unit: 'gm' },
      'l': { factor: 1000, unit: 'ml' },
      'liter': { factor: 1000, unit: 'ml' },
      'liters': { factor: 1000, unit: 'ml' },
      'ml': { factor: 1, unit: 'ml' },
      'milliliter': { factor: 1, unit: 'ml' },
      'milliliters': { factor: 1, unit: 'ml' },
      'tbsp': { factor: 15, unit: 'ml' },
      'tablespoon': { factor: 15, unit: 'ml' },
      'tablespoons': { factor: 15, unit: 'ml' },
      'tsp': { factor: 5, unit: 'ml' },
      'teaspoon': { factor: 5, unit: 'ml' },
      'teaspoons': { factor: 5, unit: 'ml' },
      'cup': { factor: 240, unit: 'ml' },
      'cups': { factor: 240, unit: 'ml' },
      'piece': { factor: 50, unit: 'gm' },
      'pieces': { factor: 60, unit: 'gm' },
      'pcs': { factor: 30, unit: 'gm' },
      'count': { factor: 50, unit: 'gm' },
      'unit': { factor: 50, unit: 'gm' },
      'units': { factor: 10, unit: 'gm' }
    };
    const mapping = unitMappings[standardizedUnit] || { factor: 100, unit: 'gm' };
    return {
      unit_quantity: Math.round(unitQuantity * mapping.factor),
      unit: mapping.unit
    };
  };

  return (
    <div className="selected-ingredients-panel">
      <div className="panel-header sticky-header">
        <h2>Ingredients</h2>
      </div>
<div style={{ color: "black", fontWeight: "bold", padding: "8px" , }}>
  <h5 style={{ margin: 0 }}>Please check before you checkout!</h5>
</div>

      <div className="ingredients-list scrollable-content">
        {selectedIngredients.map((ingredient) => {
          const { unit_quantity, unit } = standardizeUnit(ingredient.amount, ingredient.unit);
          return (
            <div 
              key={ingredient.id || ingredient.uniqueId} 
              className={`ingredient-item ${ingredient.selected ? 'selected' : ''}`}
              onClick={() => toggleIngredientSelection(ingredient.id || ingredient.uniqueId)}
            >
              <div className="ingredient-info">
                <span className="ingredient-name">{ingredient.name}</span>
                {ingredient.amount && (
                  <span className="ingredient-amount">
                    {unit_quantity} {unit}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SelectedIngredientsPanel;
