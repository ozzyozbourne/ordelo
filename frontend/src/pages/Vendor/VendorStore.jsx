import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function VendorStore() {
  const [stores, setStores] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeType, setStoreType] = useState("Delivery");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [editingIngredientId, setEditingIngredientId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    unit_quantity: "",
    price: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchStores();
      fetchIngredients();
    }
  }, [user]);
  
  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/vendor/stores", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch stores");
      const data = await response.json();

      const normalizedStores = (data.value || []).map((store) => ({
        ...store,
        id: store.store_id || store._id?.$oid || store._id,
      }));

      setStores(normalizedStores);
      if (normalizedStores.length) setActiveTab(normalizedStores[0]);
      setError(null);
    } catch (err) {
      setError("Failed to load stores. Please try again.");
      console.error("Error fetching stores:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch("http://localhost:8080/vendor/ingredients", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch ingredients");
      }
      const data = await response.json();
      let processed = [];
      
      try {
        // Try to parse as JSON if it's a string
        if (typeof data.message === 'string') {
          processed = JSON.parse(data.message).map(ingredient => ({
            ingredient_id: ingredient.ingredient_id,
            name: ingredient.name,
            unit_quantity: ingredient.unit_quantity,
            unit: ingredient.unit,
            price: ingredient.price || 0,
            times: ingredient.times || 0,
          }));
        } else if (data.ingredients) {
          // If data has an ingredients property
          processed = data.ingredients.map(ingredient => ({
            ingredient_id: ingredient.ingredient_id,
            name: ingredient.name,
            unit_quantity: ingredient.unit_quantity,
            unit: ingredient.unit,
            price: ingredient.price || 0,
            times: ingredient.times || 0,
          }));
        }
      } catch (e) {
        console.error("Error parsing ingredients:", e);
      }
      
      setIngredients(processed);
    } catch (error) {
      setError("Failed to load ingredients. Please try again.");
      console.error("Error fetching ingredients:", error);
    }
  };

  const handleCreateStore = async () => {
    if (!storeName) {
      setError("Store name is required");
      return;
    }
    
    if (!latitude || !longitude) {
      setError("Latitude and longitude are required");
      return;
    }
    
    const storePayload = {
      stores: [
        {
          name: storeName,
          store_type: storeType,
          location: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          items: [],
        },
      ],
    };

    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/vendor/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(storePayload),
      });

      if (!response.ok) throw new Error("Failed to create store");

      await response.json();
      setShowForm(false);
      setStoreName("");
      setStoreType("Delivery");
      setLatitude("");
      setLongitude("");
      setSuccess("Store created successfully!");
      setTimeout(() => setSuccess(null), 3000);
      fetchStores();
    } catch (err) {
      setError("Failed to create store. Please try again.");
      console.error("Error creating store:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingIngredientId(item.ingredient_id);
    setEditFormData({
      unit_quantity: item.unit_quantity,
      price: item.price
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    const itemToUpdate = activeTab.items?.find(item => item.ingredient_id === editingIngredientId);
    if (!itemToUpdate) return;

    const payload = {
      stores: [
        {
          store_id: activeTab.store_id,
          items: [
            {
              ingredient_id: itemToUpdate.ingredient_id,
              name: itemToUpdate.name,
              unit: itemToUpdate.unit,
              unit_quantity: itemToUpdate.unit_quantity || 0,
              price: parseFloat(editFormData.price),
              quantity: parseFloat(editFormData.quantity)
            }
          ]
        }
      ]
    };

    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/vendor/stores", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update ingredient");

      setSuccess("Ingredient updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      await fetchStores();
      setEditingIngredientId(null);
      setEditFormData({ unit_quantity: "", price: "" });
    } catch (error) {
      setError("Failed to update ingredient. Please try again.");
      console.error("Error updating ingredient:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingIngredientId(null);
    setEditFormData({
      quantity: "",
      price: ""
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading && !activeTab) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading store data...</p>
      </div>
    );
  }

  return (
    <div className="vendor-container">
      <div className="action-bar">
        <h2 className="page-title">Manage Stores</h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn btn-primary toggle-form-btn"
        >
          {showForm ? (
            <>
              <i className="fas fa-times"></i>
              <span>Cancel</span>
            </>
          ) : (
            <>
              <i className="fas fa-plus"></i>
              <span>Create Store</span>
            </>
          )}
        </button>
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

      {/* Store Tabs */}
      {stores.length > 0 ? (
        <div className="tabs">
          {stores.map((store) => (
            <button
              key={store.id}
              className={`tab-button ${activeTab?.id === store.id ? "active" : ""}`}
              onClick={() => setActiveTab(store)}
            >
              {store.name} ({store.items?.length || 0} items)
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-store"></i>
          <h3>No stores available</h3>
          <p>Create your first store to start managing inventory.</p>
        </div>
      )}

      {/* Store Details */}
      {activeTab && (
        <div className="store-details">
          <div className="vendor-panel">
            <div className="vendor-panel-header">
              <h3>Store Details</h3>
            </div>
            <div className="vendor-panel-body">
              <div className="data-grid">
                <div className="data-label">Name:</div>
                <div className="data-value">{activeTab.name}</div>
                <div className="data-label">Type:</div>
                <div className="data-value">{activeTab.store_type}</div>
                <div className="data-label">Items:</div>
                <div className="data-value">{activeTab.items?.length || 0}</div>
                <div className="data-label">Location:</div>
                <div className="data-value">
                  {activeTab.location?.coordinates ? 
                    `(${activeTab.location.coordinates[1]}, ${activeTab.location.coordinates[0]})` : 
                    'Not specified'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab && (
  <div className="vendor-section">
    <h3 className="vendor-section-title">Inventory for {activeTab.name}</h3>
    {activeTab.items && activeTab.items.length > 0 ? (
      <div className="ingredients-table-container">
        <table className="ingredients-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit Quantity</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeTab.items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.name}</td>
                {editingIngredientId === item.ingredient_id ? (
                  <>
                    <td>
                     <span className="unit-label">{item.unit_quantity}</span>
                      <span className="unit-label">{item.unit}</span>
                    </td>
                    <td>
                      <input
                        type="number"
                        name="quantity"
                        value={editFormData.quantity}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="price"
                        value={editFormData.price}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button onClick={handleSaveEdit} className="btn btn-sm btn-primary">
                          <i className="fas fa-save"></i>
                          <span>Save</span>
                        </button>
                        <button onClick={handleCancelEdit} className="btn btn-sm btn-secondary">
                          <i className="fas fa-times"></i>
                          <span>Cancel</span>
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{item.unit_quantity} {item.unit}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <span className="price-inline">
                        <span className="dollar-sign">$</span>
                        {formatCurrency(item.price).replace('$', '')}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleEditClick(item)} className="btn btn-sm btn-primary">
                        <i className="fas fa-edit"></i>
                        <span>Edit</span>
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="empty-state">
        <i className="fas fa-box-open"></i>
        <h3>No ingredients assigned yet</h3>
        <p>Add products to your inventory to get started.</p>
        <button
          onClick={() => navigate("/vendor/add-inventory")}
          className="btn btn-primary mt-md"
        >
          <i className="fas fa-plus"></i>
          <span>Add Products</span>
        </button>
      </div>
    )}
  </div>
)}

      {/* Create Store Form */}
      {showForm && (
        <div className="vendor-section">
          <div className="vendor-panel">
            <div className="vendor-panel-header">
              <h3>Create New Store</h3>
            </div>
            <div className="vendor-panel-body">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="storeName">Store Name</label>
                  <input
                    id="storeName"
                    type="text"
                    placeholder="Enter Store Name"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="storeType">Store Type</label>
                  <select 
                    id="storeType"
                    value={storeType} 
                    onChange={(e) => setStoreType(e.target.value)}
                    className="form-control"
                  >
                    <option value="Delivery">Delivery</option>
                    <option value="Pickup">Pickup</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="latitude">Latitude</label>
                  <input
                    id="latitude"
                    type="number"
                    placeholder="Enter Latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="form-control"
                    required
                    step="any"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="longitude">Longitude</label>
                  <input
                    id="longitude"
                    type="number"
                    placeholder="Enter Longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="form-control"
                    required
                    step="any"
                  />
                </div>
              </div>
            </div>
            <div className="panel-footer">
              <button 
                onClick={handleCreateStore} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    <span>Save Store</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorStore;