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
  
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const token = storedUser?.token;

  const fetchIngredients = () => {
    setLoading(true);
    setError(null);

    fetch("http://localhost:8080/admin/ingredients", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Unauthorized or failed to fetch ingredients");
        }
        return response.json();
      })
      .then(data => setIngredients(data.ingredients || []))
      .catch(() => setError("Failed to load ingredients."))
      .finally(() => setLoading(false));
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
      name: newIngredient.name,
      unit_quantity: unitQuantity,
      unit: unit,
      price: 0.0 
    };
    
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = storedUser?.token;

    fetch("http://localhost:8080/admin/ingredients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to add ingredient");
        }
        return response.json();
      })
      .then(() => {
        setNewIngredient({
          name: '',
          unit_quantity: '',
          unit: ''
        });
        fetchIngredients();
      })
      .catch(() => alert("Failed to add ingredient."))
      .finally(() => setAdding(false));
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Ingredient Management</h1>
      </div>

      <h2>Add New Ingredient</h2>
      <form onSubmit={handleAddIngredient} style={{ marginBottom: "20px" }}>
        <input 
          type="text"
          name="name"
          placeholder="Ingredient Name"
          value={newIngredient.name}
          onChange={handleInputChange}
          required
        />
        <input 
          type="number"
          name="unit_quantity"
          placeholder="Unit Quantity (SI Units Only)"
          value={newIngredient.unit_quantity}
          onChange={handleInputChange}
          required
        />
        <input 
          type="text"
          name="unit"
          placeholder="Unit (gm, ml)"
          value={newIngredient.unit}
          onChange={handleInputChange}
          required
        />
        <button type="submit" disabled={adding}>
          {adding ? "Adding..." : "Add Ingredient"}
        </button>
      </form>

      {loading && <LoadingSpinner message="Loading ingredients..." />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit Quantity</th>
              <th>Unit (SI)</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map(ingredient => (
              <tr key={ingredient}>
                <td>{ingredient.name}</td>
                <td>{ingredient.unit_quantity}</td>
                <td>{ingredient.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default IngredientManagementPage;
