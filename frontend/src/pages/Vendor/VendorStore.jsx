// src/pages/Vendor/VendorStore.jsx
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

  useEffect(() => {
    if (user) fetchStores();
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

      const data = await response.json();
      console.log("Store created:", data);

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
      const ingredientsArray = JSON.parse(data.message);

      const processed = ingredientsArray.map((ingredient) => ({
        _id: ingredient.ingredient_id,
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

  
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    const updatedIngredients = ingredients.map((ing) =>
      ing._id === editingId ? { ...ing, ...editFormData } : ing
    );
    setIngredients(updatedIngredients);
  
    const updatedStores = stores.map((store) => {
      if (store.id === activeTab.id) {
        const existingIndex = store.items.findIndex((item) => item._id === editingId);
  
        const updatedIngredient = {
          _id: editingId,
          name: editFormData.name,
          unit_quantity: editFormData.unit_quantity,
          unit: editFormData.unit,
          price: editFormData.price,
          times: editFormData.times,
        };
  
        let updatedItems;
        if (existingIndex !== -1) {
          // Update existing ingredient
          updatedItems = store.items.map((item) =>
            item._id === editingId ? updatedIngredient : item
          );
        } else {
          // Add new ingredient to this store
          updatedItems = [...store.items, updatedIngredient];
        }
  
        return { ...store, items: updatedItems };
      }
      return store; // all other stores remain unchanged
    });
  
    setStores(updatedStores);
    setActiveTab(updatedStores.find((s) => s.id === activeTab.id));
    handleCancelEdit();
  };

  const updateStatus = async (order, newStatus) => {
    try {
      const response = await fetch("http://localhost:8080/vendor/userorder/accept", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          user_id: order.user_id, // This is the correct user_id from the VendorOrder
          order_id: order.order_id, // This is the ID from the embedded Order
          order_status: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update order status");
      }

      // Refresh orders after update
      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="vendor-store-container">
      <h1>Vendor Stores</h1>
      <div className="tabs">
        {stores.map((store) => (
          <button
            key={store.id}
            className={`tab-button ${
              activeTab?.id === store.id ? "active" : ""
            }`}
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
                </tr>
              </thead>
              <tbody>
                {activeTab.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{item.unit_quantity}</td>
                    <td>{item.unit}</td>
                    <td>{item.price}</td>
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
