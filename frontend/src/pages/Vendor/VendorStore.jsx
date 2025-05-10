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
  const { user, loading } = useAuth();
  const [editingIngredientId, setEditingIngredientId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    unit_quantity: "",
    price: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== "vendor")) {
      navigate("/vendor/login");
    }
  }, [user, loading, navigate]);

  const fetchStores = async () => {
    try {
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
        id: store._id?.$oid || store._id,
      }));

      setStores(normalizedStores);
      if (normalizedStores.length) setActiveTab(normalizedStores[0]);
    } catch (err) {
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
      if (!response.ok) {
        throw new Error("Unauthorized or failed to fetch ingredients");
      }
      const data = await response.json();
      const processed = (data.ingredients || []).map(ingredient => ({
        ingredient_id: ingredient.ingredient_id,
        name: ingredient.name,
        unit_quantity: ingredient.unit_quantity,
        unit: ingredient.unit,
        price: ingredient.price || 0,
        times: ingredient.times || 0,
      }));
      setIngredients(processed);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStores();
      fetchIngredients();
    }
  }, [user]);

  const handleCreateStore = async () => {
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

      fetchStores();
    } catch (err) {
      console.error("Error creating store:", err);
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
    const itemToUpdate = activeTab.items.find(item => item.ingredient_id === editingIngredientId);
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
              unit_quantity: parseFloat(editFormData.unit_quantity),
              price: parseFloat(editFormData.price),
              quantity: itemToUpdate.quantity || 0
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch("http://localhost:8080/vendor/stores", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update ingredient");

      await fetchStores();
      setEditingIngredientId(null);
      setEditFormData({ unit_quantity: "", price: "" });
    } catch (error) {
      console.error("Error updating ingredient:", error);
      alert("Failed to update ingredient. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingIngredientId(null);
    setEditFormData({
      unit_quantity: "",
      price: ""
    });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="vendor-store-container">
      <h1>Vendor Stores</h1>
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

      {activeTab ? (
        <div className="store-details">
          <h2>Store Details</h2>
          <p><strong>Name:</strong> {activeTab.name}</p>
          <p><strong>Type:</strong> {activeTab.store_type}</p>
          <p><strong>Items:</strong> {activeTab.items?.length || 0}</p>
        </div>
      ) : (
        <p>No stores available.</p>
      )}
      <hr />
      {activeTab && (
        <div className="store-details">
          <h3>Inventory for {activeTab.name}</h3>
          {activeTab.items && activeTab.items.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Unit Quantity</th>
                  <th>Unit</th>
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
                          <input
                            type="number"
                            name="unit_quantity"
                            value={editFormData.unit_quantity}
                            onChange={handleEditChange}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>{item.unit}</td>
                        <td>
                          <input
                            type="number"
                            name="price"
                            value={editFormData.price}
                            onChange={handleEditChange}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <button onClick={handleSaveEdit} className="btn btn-primary btn-sm">Save</button>
                          <button onClick={handleCancelEdit} className="btn btn-secondary btn-sm">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{item.unit_quantity}</td>
                        <td>{item.unit}</td>
                        <td>{item.price}</td>
                        <td>
                          <button onClick={() => handleEditClick(item)} className="btn btn-primary btn-sm">
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No ingredients assigned yet.</p>
          )}
        </div>
      )}

      <h3>Create New Store</h3>
      <button className="toggle-form-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Close Form" : "Create Store"}
      </button>

      {showForm && (
        <div className="create-form">
          <input
            type="text"
            placeholder="Enter Store Name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
          <select value={storeType} onChange={(e) => setStoreType(e.target.value)}>
            <option value="Delivery">Delivery</option>
            <option value="Pickup">Pickup</option>
          </select>
          <input
            type="number"
            placeholder="Enter Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />
          <input
            type="number"
            placeholder="Enter Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
          <button onClick={handleCreateStore}>Save Store</button>
        </div>
      )}
    </div>
  );
}

export default VendorStore;
