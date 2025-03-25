// src/components/FloatingButton.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRecipes } from "../context/RecipeContext";

function FloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedRecipes, removeFromSelected, clearSelectedRecipes, addToShoppingList } = useRecipes();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Only show on home and saved recipes pages
  if (location.pathname !== '/' && location.pathname !== '/saved-recipes') {
    return null;
  }
  
  const handleGenerateShoppingList = () => {
    const allIngredients = selectedRecipes.flatMap(recipe => 
      recipe.extendedIngredients || []
    );
    addToShoppingList(allIngredients);
    setIsOpen(false);
    navigate('/shopping-list');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #5ECC62, #00A896)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem'
        }}
      >
        <i className="fas fa-shopping-basket"></i>
        {selectedRecipes.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#FF6B6B',
            color: 'white',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {selectedRecipes.length}
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '1rem'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsOpen(false);
        }}
        >
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            right: '2rem',
            width: '400px',
            maxWidth: '90vw',
            maxHeight: '70vh',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.2rem',
              borderBottom: '1px solid #E8E8E8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0 }}>Selected Recipes ({selectedRecipes.length})</h3>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  color: '#555',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              overflow: 'auto',
              padding: '1rem',
              maxHeight: 'calc(70vh - 140px)'
            }}>
              {selectedRecipes.length > 0 ? (
                selectedRecipes.map(recipe => (
                  <div key={recipe.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.8rem',
                    marginBottom: '0.8rem',
                    background: '#E8E8E8',
                    borderRadius: '8px'
                  }}>
                    <img 
                      src={recipe.image || '/src/assets/placeholder-food.jpg'}
                      alt={recipe.title}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        marginRight: '1rem'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>{recipe.title}</h4>
                      <span style={{ fontSize: '0.8rem', color: '#555' }}>
                        {recipe.readyInMinutes || '30'} min
                      </span>
                    </div>
                    <button 
                      onClick={() => removeFromSelected(recipe.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#555',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem 1rem' 
                }}>
                  <i className="fas fa-shopping-basket" style={{ 
                    fontSize: '3rem', 
                    color: '#C0C0C0', 
                    marginBottom: '1rem' 
                  }}></i>
                  <p style={{ margin: '0.5rem 0' }}>No recipes selected yet.</p>
                  <p style={{ margin: '0.5rem 0' }}>Select recipes to generate a shopping list.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #E8E8E8',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              {selectedRecipes.length > 0 ? (
                <>
                  <button 
                    onClick={clearSelectedRecipes}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'white',
                      color: '#00A896',
                      border: '1px solid #00A896',
                      cursor: 'pointer',
                      fontWeight: '500',
                      flex: '1'
                    }}
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={handleGenerateShoppingList}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #5ECC62, #00A896)',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '500',
                      flex: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <i className="fas fa-shopping-basket"></i> Generate Shopping List
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #5ECC62, #00A896)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '500',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <i className="fas fa-search"></i> Browse Recipes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingButton;