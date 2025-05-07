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
