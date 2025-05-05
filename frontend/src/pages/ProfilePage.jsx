// src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

 
  const decoded = jwtDecode(user.token);
  const name = decoded.name;
  const address = decoded.address;
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
        setOrders(data.orders || []); // expecting { orders: [...] }
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
              <button className={`profile-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>Notifications</button>
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
                  <div className="info-group"><h3>Full Name</h3><p>{name || 'Not provided'}</p></div>
                  <div className="info-group"><h3>Email Address</h3><p>{email || 'Not provided'}</p></div>
                  <div className="info-group"><h3>Address</h3><p>{address || 'Not provided'}</p></div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="tab-content">
                <h2>Order History</h2>

                {ordersLoading && <p>Loading orders...</p>}
                {ordersError && <p style={{ color: "red" }}>{ordersError}</p>}

                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Delivery Method</th>
                      <th>Status</th>
                      <th>Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 && !ordersLoading && !ordersError && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center" }}>No orders found.</td>
                      </tr>
                    )}

                    {orders.map(order => (
                      <tr key={order.order_id}>
                        <td>{order.order_id}</td>
                        <td>{order.delivery_method}</td>
                        <td>{order.order_status}</td>
                        <td>${order.total_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="tab-content">
                <h2>Saved Recipes</h2>
                <Link to="/saved-recipes">View Saved Recipes</Link>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="tab-content">
                <h2>Notifications</h2>
                <p>Notification settings here (not connected yet).</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
