import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Inventory() {
  const [stores, setStores] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    unit_quantity: "",
    unit: "",
    price: "",
    times: "",
  });

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
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      const data = await response.json();
      const formatted = (data.value || []).map((store) => ({
        ...store,
        id: store._id?.$oid || store._id,
      }));
      setStores(formatted);
      if (formatted.length) setActiveTab(formatted[0]);
    } catch (err) {
      console.error("Failed to fetch stores:", err);
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

   2
      const ingredientsArray = JSON.parse(data.message); // ← fix here

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
  


  if (loading) return <p>Loading...</p>;

  return (
    <div className="vendor-store-container">
      <h1>Vendor Inventory</h1>

      {/* Store Tabs */}
      <div className="tabs">
        {stores.map((store) => (
          <button
            key={store.id}
            className={`tab-button ${activeTab?.id === store.id ? "active" : ""}`}
            onClick={() => setActiveTab(store)}
          >
            {store.name}
          </button>
        ))}
      </div>

      {/* Inventory Table for Store */}
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
    
    </div>
  );
}

export default Inventory;
