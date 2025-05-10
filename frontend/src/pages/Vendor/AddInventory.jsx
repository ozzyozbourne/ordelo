import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AddInventory = () => {
  const [ingredients, setIngredients] = useState([]);
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ingredientPrices, setIngredientPrices] = useState({});
  const [ingredientQuantities, setIngredientQuantities] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchStores();
    fetchIngredients();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/vendor/stores", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch stores");
      
      const data = await response.json();

      const normalizedStores = (data.value || []).map((store) => ({
        ...store,
        id: store.store_id
      }));

      setStores(normalizedStores);
      if (normalizedStores.length) {
        setSelectedStore(normalizedStores[0]);
      }
    } catch (err) {
      setError("Failed to load stores. Please try again.");
      console.error("Error fetching stores:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/vendor/ingredients", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch ingredients");
      
      const data = await response.json();
      const parsedIngredients = JSON.parse(data.message);
      setIngredients(parsedIngredients);
      setFilteredIngredients(parsedIngredients);
    } catch (err) {
      setError("Failed to load ingredients. Please try again.");
      console.error("Error fetching ingredients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = ingredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIngredients(filtered);
  }, [searchTerm, ingredients]);

  const handlePriceChange = (ingredientId, value) => {
    setIngredientPrices(prev => ({
      ...prev,
      [ingredientId]: value
    }));
  };

  const handleQuantityChange = (ingredientId, value) => {
    setIngredientQuantities(prev => ({
      ...prev,
      [ingredientId]: value
    }));
  };

  const handleAdd = async (ingredient) => {
    if (!selectedStore?.store_id) {
      setError("Please select a store first");
      return;
    }

    const price = ingredientPrices[ingredient.ingredient_id];
    const quantity = ingredientQuantities[ingredient.ingredient_id];

    if (!price || !quantity) {
      setError("Please fill in both price and quantity");
      return;
    }

    const requestBody = {
      stores: [
        {
          store_id: selectedStore.store_id,
          items: [
            {
              name: ingredient.name,
              unit_quantity: ingredient.unit_quantity,
              unit: ingredient.unit,
              price: parseFloat(price),
              quantity: parseInt(quantity)
            }
          ]
        }
      ]
    };

    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:8080/vendor/stores",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add ingredient");
      }
      
      // Clear the inputs after successful addition
      setIngredientPrices(prev => ({
        ...prev,
        [ingredient.ingredient_id]: ""
      }));
      setIngredientQuantities(prev => ({
        ...prev,
        [ingredient.ingredient_id]: ""
      }));
      
      // Show success message
      setSuccess(`Successfully added ${ingredient.name} to inventory!`);
      setTimeout(() => setSuccess(null), 3000); // Clear after 3 seconds
      
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to add ingredient. Please try again.");
      console.error("Error adding ingredient:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && ingredients.length === 0 && stores.length === 0) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="add-inventory-container">
      <div className="action-bar">
        <h2 className="page-title">Add Inventory</h2>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate("/vendor/store")}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Inventory</span>
        </button>
      </div>

      {/* Store Selection */}
      <div className="vendor-section">
        <h3 className="vendor-section-title">Select Store</h3>
        <div className="form-group">
          <select 
            value={selectedStore?.store_id || ""} 
            onChange={(e) => {
              const store = stores.find(s => s.store_id === e.target.value);
              setSelectedStore(store);
            }}
            className="form-control store-select"
          >
            <option key="default" value="">Select a store</option>
            {stores.map(store => (
              <option key={store.store_id} value={store.store_id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="vendor-section">
        <h3 className="vendor-section-title">Search Ingredients</h3>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
        </div>
      )}

      {/* Ingredients Table */}
      <div className="vendor-section">
        <h3 className="vendor-section-title">Available Ingredients</h3>
        <div className="ingredients-table-container">
          <table className="ingredients-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Unit Quantity</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.length > 0 ? (
                filteredIngredients.map((ingredient) => (
                  <tr key={ingredient.ingredient_id}>
                    <td>{ingredient.name}</td>
                    <td>{ingredient.unit_quantity}</td>
                    <td>{ingredient.unit}</td>
                    <td>
                      <div className="price-input-group">
                        <span className="dollar-sign">$</span>
                        <input
                          type="number"
                          value={ingredientPrices[ingredient.ingredient_id] || ""}
                          onChange={(e) => handlePriceChange(ingredient.ingredient_id, e.target.value)}
                          placeholder="Enter price"
                          min="0"
                          step="0.01"
                          className="form-control price-input"
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={ingredientQuantities[ingredient.ingredient_id] || ""}
                        onChange={(e) => handleQuantityChange(ingredient.ingredient_id, e.target.value)}
                        placeholder="Enter quantity"
                        min="0"
                        className="form-control quantity-input"
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleAdd(ingredient)}
                        className="btn btn-primary add-button"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="spinner"></span>
                        ) : (
                          <>
                            <i className="fas fa-plus"></i>
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    <div className="empty-state">
                      <i className="fas fa-search"></i>
                      <h3>No ingredients found</h3>
                      <p>Try adjusting your search term or check back later for more ingredients.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AddInventory;