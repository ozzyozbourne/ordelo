import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "/Users/zohaahmed/ordelo/ordelo/frontend/src/context/AuthContext.jsx";
import { jwtDecode } from "jwt-decode";
import VendorOrder from "./VendorOrder";

function VendorProfilePage() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && (!user || user.role !== "vendor")) {
      navigate("/vendor/login");
    }
  }, [user, loading, navigate]);

  // Initialize user info from token
  useEffect(() => {
    if (user?.token) {
      try {
        const decoded = jwtDecode(user.token);
        setName(decoded.name || "");
        setAddress(decoded.address || "");
        setEmail(user.email || "");
      } catch (err) {
        console.error("Failed to decode token:", err.message);
      }
    }
  }, [user]);

  // Fetch vendor orders
  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const response = await fetch("http://localhost:8080/vendor/orders", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        setOrders(data.value || []);
      } catch (err) {
        setOrdersError(err.message);
      } finally {
        setOrdersLoading(false);
      }
    };

    if (user?.token) {
      fetchOrders();
    }
  }, [user?.token]);

  if (loading) return <div className="profile-page">Loading...</div>;

  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">Vendor Dashboard</h1>
          <p className="page-description">Manage your store and orders</p>
        </div>
      </div>

      <div className="container">
        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="profile-avatar">
              <div className="avatar-circle">
                {name?.charAt(0).toUpperCase()}
              </div>
              <h3>{name}</h3>
            </div>

            <div className="profile-tabs">
              <button
                className={`profile-tab ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                Store Info
              </button>
              <button
                className={`profile-tab ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                Orders
              </button>
            </div>

            <div className="profile-logout">
              <button onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </div>

          <div className="profile-main">
            {activeTab === "profile" && (
              <div className="tab-content">
                <h2>Store Info</h2>
                <div className="profile-info">
                  <div className="info-group">
                    <h3>Store Name</h3>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="info-group">
                    <h3>Address</h3>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="info-group">
                    <h3>Email Address</h3>
                    <p>{email || "Not provided"}</p>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      try {
                        const response = await fetch("http://localhost:8080/vendor", {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${user.token}`,
                          },
                          body: JSON.stringify({ name, address }),
                        });

                        if (!response.ok) {
                          throw new Error("Failed to update profile");
                        }

                        alert("Store info updated successfully!");
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="tab-content">
                <h2>Orders</h2>
                {ordersLoading && <p>Loading orders...</p>}
                {ordersError && <p style={{ color: "red" }}>{ordersError}</p>}
                <VendorOrder orders={orders} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorProfilePage;
