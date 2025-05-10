import React, { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const IngredientManagementPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    unit_quantity: '',
    unit: '',
  });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const token = storedUser?.token;

  const fetchIngredients = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8080/admin/ingredients", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Unauthorized or failed to fetch ingredients");
      }

      const data = await response.json();
      const processed = (data.ingredients || []).map(ingredient => ({
        _id: ingredient.ingredient_id,
        name: ingredient.name,
        unit_quantity: ingredient.unit_quantity,
        unit: ingredient.unit
      }));

      setIngredients(processed);
    } catch (error) {
      setError("Failed to load ingredients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewIngredient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    setAdding(true);

    const unitQuantity = parseFloat(newIngredient.unit_quantity);
    const unit = newIngredient.unit.trim();

    if (!unitQuantity || unitQuantity <= 0 || !unit) {
      alert("Please enter valid unit quantity and unit (SI units only).");
      setAdding(false);
      return;
    }

    const payload = {
      ingredients: [
        {
          name: newIngredient.name,
          unit_quantity: unitQuantity,
          unit: unit
        }
      ]
    };

    try {
      const response = await fetch("http://localhost:8080/admin/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to add ingredient");
      }

      await response.json();
      setNewIngredient({
        name: '',
        unit_quantity: '',
        unit: ''
      });
      fetchIngredients();
    } catch (error) {
      alert("Failed to add ingredient.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteIngredient = async (ingredientId) => {
    if (!window.confirm(`Are you sure you want to delete this ingredient?`)) {
      return;
    }

    const payload = {
      ingredient_ids: [ingredientId]
    };

    try {
      const response = await fetch("http://localhost:8080/admin/ingredients", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to delete ingredient");
      }

      await response.json();
      fetchIngredients();
    } catch (error) {
      alert("Failed to delete ingredient.");
    }
  };

  const handleEditClick = (ingredient) => {
    setEditingId(ingredient._id);
    setEditFormData({
      name: ingredient.name,
      unit_quantity: ingredient.unit_quantity,
      unit: ingredient.unit,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async () => {
    const payload = {
      ingredients: [
        {
          ingredient_id: editingId,
          name: editFormData.name,
          unit_quantity: parseFloat(editFormData.unit_quantity),
          unit: editFormData.unit,
        }
      ]
    };

    try {
      const response = await fetch("http://localhost:8080/admin/ingredients", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to update ingredient");
      }

      await response.json();
      fetchIngredients();
      setEditingId(null);
      setEditFormData({});
    } catch (error) {
      alert("Failed to update ingredient.");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  return (
    <div className="ingredient-management">
      <div className="admin-page-header">
        <h1>Ingredient Management</h1>
      </div>

      <div className="ingredient-form">
        <h2>Add New Ingredient</h2>
        <form onSubmit={handleAddIngredient} className="ingredient-form-grid">
          <div className="ingredient-form-group">
            <label htmlFor="name">Ingredient Name</label>
            <input 
              id="name"
              type="text"
              name="name"
              placeholder="Enter ingredient name"
              value={newIngredient.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="ingredient-form-group">
            <label htmlFor="unit_quantity">Unit Quantity</label>
            <input 
              id="unit_quantity"
              type="number"
              name="unit_quantity"
              placeholder="Enter quantity (SI Units Only)"
              value={newIngredient.unit_quantity}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="ingredient-form-group">
            <label htmlFor="unit">Unit</label>
            <input 
              id="unit"
              type="text"
              name="unit"
              placeholder="Enter unit (gm, ml)"
              value={newIngredient.unit}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="ingredient-form-group">
            <button type="submit" className="ingredient-btn ingredient-btn-edit" disabled={adding}>
              {adding ? "Adding..." : "Add Ingredient"}
            </button>
          </div>
        </form>
      </div>

      {loading && <LoadingSpinner message="Loading ingredients..." />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div className="ingredient-table-container">
          <table className="ingredient-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Unit Quantity</th>
                <th>Unit (SI)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient, index) => (
                <tr key={index}>
                  {editingId === ingredient._id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name}
                          onChange={handleEditChange}
                          className="ingredient-form-group input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="unit_quantity"
                          value={editFormData.unit_quantity}
                          onChange={handleEditChange}
                          className="ingredient-form-group input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="unit"
                          value={editFormData.unit}
                          onChange={handleEditChange}
                          className="ingredient-form-group input"
                        />
                      </td>
                      <td className="ingredient-actions">
                        <button onClick={handleSaveEdit} className="ingredient-btn ingredient-btn-edit">Save</button>
                        <button onClick={handleCancelEdit} className="ingredient-btn ingredient-btn-delete">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{ingredient.name}</td>
                      <td>{ingredient.unit_quantity}</td>
                      <td>{ingredient.unit}</td>
                      <td className="ingredient-actions">
                        <button onClick={() => handleEditClick(ingredient)} className="ingredient-btn ingredient-btn-edit">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteIngredient(ingredient._id)} className="ingredient-btn ingredient-btn-delete">
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IngredientManagementPage;
