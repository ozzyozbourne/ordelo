import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function VendorInventory() {
  const [stores, setStores] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== "vendor")) {
      navigate("/vendor/login");
    }
  }, [user, loading, navigate]);

  const fetchInventories = async () => {
    try {
      const response = await fetch("http://localhost:8080/vendor/ingredients", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch inventory");
      const data = await response.json();

      const normalizedStores = (data.stores || []).map((store) => ({
        ...store,
        id: store._id?.$oid || store._id, // flatten Mongo _id
      }));

      setStores(normalizedStores);
      if (normalizedStores.length) setActiveTab(normalizedStores[0]);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  useEffect(() => {
    if (user) fetchInventories();
  }, [user]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="vendor-store-container">
      <h1>Vendor Inventory</h1>

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
          <h2>{activeTab.name} - Inventory</h2>
          <p><strong>Store Type:</strong> {activeTab.store_type}</p>
          <p><strong>Item Count:</strong> {activeTab.items?.length || 0}</p>

          <ul className="ingredient-list">
            {activeTab.items?.length > 0 ? (
              activeTab.items.map((item, idx) => (
                <li key={idx}>
                  <strong>{item.name || "Unnamed Ingredient"}</strong>
                  {item.quantity && <span> — Qty: {item.quantity}</span>}
                </li>
              ))
            ) : (
              <p>No ingredients available in this store.</p>
            )}
          </ul>
        </div>
      ) : (
        <p>No stores available.</p>
      )}
    </div>
  );
}

export default VendorInventory;
