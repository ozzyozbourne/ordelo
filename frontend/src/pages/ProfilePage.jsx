import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import AddRecipe from "./AddRecipe";
import SavedRecipes from "./SavedRecipes"
import Orders from "./Orders"

function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  const decoded = jwtDecode(user.token);
  const [name, setName] = useState(decoded.name || "");
  const [address, setAddress] = useState(decoded.address || "");
  const email = user.email;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const response = await fetch("http://localhost:8080/user/orders", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err) {
        setOrdersError(err.message);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user.token]);

  if (loading) {
    return <div className="profile-page">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">Your Profile</h1>
          <p className="page-description">Manage your account settings and preferences</p>
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
              <button className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile Information</button>
              <button className={`profile-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Order History</button>
              <button className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>Saved Recipes</button>
              <button className={`profile-tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>Add Recipe</button>
            </div>

            <div className="profile-logout">
              <button onClick={logout} className="btn btn-secondary">Logout</button>
            </div>
          </div>

          <div className="profile-main">

            {activeTab === 'profile' && (
              <div className="tab-content">
                <h2>Profile Information</h2>
                <div className="profile-info">
                  <div className="info-group">
                    <h3>Full Name</h3>
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
                    <p>{email || 'Not provided'}</p>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      try {
                        const response = await fetch("http://localhost:8080/user", {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${user.token}`,
                          },
                          body: JSON.stringify({
                            name,
                            address,
                          }),
                        });

                        if (!response.ok) {
                          throw new Error("Failed to update profile");
                        }

                        alert("Profile updated successfully!");

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

            {activeTab === 'orders' && (
              <div className="tab-content">
                <h2>Order History</h2>

                {ordersLoading && <p>Loading orders...</p>}
                {ordersError && <p style={{ color: "red" }}>{ordersError}</p>}

                <table>
                  <tbody>
                        <Orders/>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="tab-content">
                <h2>Saved Recipes</h2>
                <SavedRecipes/>
              </div>
            )}

            {activeTab === 'add' && (
              <div className="tab-content">
                <h2>Add New Recipe</h2>
                <AddRecipe/>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
