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
      const response = await fetch("http://localhost:8080/vendor/stores", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch stores");
      
      const data = await response.json();
      console.log("Raw store data:", data);

      const normalizedStores = (data.value || []).map((store) => ({
        ...store,
        id: store.store_id
      }));

      console.log("Normalized stores:", normalizedStores);
      setStores(normalizedStores);
      if (normalizedStores.length) {
        setSelectedStore(normalizedStores[0]);
      }
    } catch (err) {
      setError("Failed to load stores. Please try again.");
      console.error("Error fetching stores:", err);
    }
  };

  const fetchIngredients = async () => {
    try {
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

    console.log("Request Body:", requestBody); // Debug log

    try {
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
        console.error("Error response:", errorData);
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
      
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to add ingredient. Please try again.");
      console.error("Error adding ingredient:", err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="add-inventory-container">
      <div className="add-inventory-header">
        <h1>Add Inventory</h1>
        <button 
          className="back-button"
          onClick={() => navigate("/vendor/inventory")}
        >
          Back to Inventory
        </button>
      </div>

      {/* Store Selection */}
      <div className="store-selection">
        <select 
          value={selectedStore?.store_id || ""} 
          onChange={(e) => {
            const store = stores.find(s => s.store_id === e.target.value);
            setSelectedStore(store);
          }}
          className="store-select"
        >
          <option key="default" value="">Select a store</option>
          {stores.map(store => (
            <option key={store.store_id} value={store.store_id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

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
            {filteredIngredients.map((ingredient) => (
              <tr key={ingredient.ingredient_id}>
                <td>{ingredient.name}</td>
                <td>{ingredient.unit_quantity}</td>
                <td>{ingredient.unit}</td>
                <td>
                  <input
                    type="number"
                    value={ingredientPrices[ingredient.ingredient_id] || ""}
                    onChange={(e) => handlePriceChange(ingredient.ingredient_id, e.target.value)}
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    className="price-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={ingredientQuantities[ingredient.ingredient_id] || ""}
                    onChange={(e) => handleQuantityChange(ingredient.ingredient_id, e.target.value)}
                    placeholder="Enter quantity"
                    min="0"
                    className="quantity-input"
                  />
                </td>
                <td>
                  <button
                    onClick={() => handleAdd(ingredient)}
                    className="add-button"
                  >
                    Add
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddInventory;