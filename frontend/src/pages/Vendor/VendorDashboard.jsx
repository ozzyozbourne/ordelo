import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { jwtDecode } from "jwt-decode";

function VendorDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [decoded, setDecoded] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    mostPopularItem: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if not a vendor
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "vendor")) {
      navigate("/vendor/login");
    }
  }, [user, authLoading, navigate]);

  // Decode token safely
  useEffect(() => {
    if (user?.token) {
      try {
        const decodedToken = jwtDecode(user.token);
        setDecoded(decodedToken);
      } catch (err) {
        console.error("Failed to decode token:", err.message);
        setDecoded(null);
      }
    }
  }, [user]);

  // Fetch orders and stores
  useEffect(() => {
    if (user?.token) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stores
      const storesResponse = await fetch("http://localhost:8080/vendor/stores", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      
      if (!storesResponse.ok) throw new Error("Failed to fetch stores");
      const storesData = await storesResponse.json();
      const normalizedStores = (storesData.value || []);
      setStores(normalizedStores);
      
      // Fetch orders
      const ordersResponse = await fetch("http://localhost:8080/vendor/orders", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      
      if (!ordersResponse.ok) throw new Error("Failed to fetch orders");
      const ordersData = await ordersResponse.json();
      const normalizedOrders = (ordersData.value || []);
      setOrders(normalizedOrders);
      
      // Calculate stats
      calculateStats(normalizedOrders);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList) => {
    if (!ordersList || ordersList.length === 0) {
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        revenue: 0,
        mostPopularItem: null
      });
      return;
    }

    // Count orders by status
    const pending = ordersList.filter(order => order.order_status === "Pending" || order.order_status === "pending").length;
    
    // Calculate total revenue
    const revenue = ordersList.reduce((total, order) => {
      return total + (parseFloat(order.total_price) || 0);
    }, 0);
    
    // Find most popular item
    const itemCounts = {};
    ordersList.forEach(order => {
      if (order.items && order.items.length) {
        order.items.forEach(item => {
          const itemName = item.name;
          itemCounts[itemName] = (itemCounts[itemName] || 0) + 1;
        });
      }
    });
    
    let mostPopular = { name: "No items", count: 0 };
    Object.keys(itemCounts).forEach(item => {
      if (itemCounts[item] > mostPopular.count) {
        mostPopular = { name: item, count: itemCounts[item] };
      }
    });
    
    setStats({
      totalOrders: ordersList.length,
      pendingOrders: pending,
      revenue,
      mostPopularItem: mostPopular.name
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (authLoading || loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="vendor-container">
      {/* Welcome Banner */}
      <div className="dashboard-welcome">
        <h1>Welcome, {decoded?.name || "Vendor"}</h1>
        <p>Manage your store inventory, track orders, and grow your business with Ordelo.</p>
        
        <div className="vendor-profile-info">
          <div className="profile-item">
            <i className="fas fa-envelope"></i>
            <span>{user?.email || "Not available"}</span>
          </div>
          <div className="profile-item">
            <i className="fas fa-map-marker-alt"></i>
            <span>{decoded?.address || "No address found"}</span>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <i className="fas fa-shopping-bag"></i>
          <h3>Total Orders</h3>
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-change">All time</div>
        </div>
        
        <div className="stat-card">
          <i className="fas fa-clock"></i>
          <h3>Pending Orders</h3>
          <div className="stat-value">{stats.pendingOrders}</div>
          <div className="stat-change">Needs attention</div>
        </div>
        
        <div className="stat-card">
          <i className="fas fa-dollar-sign"></i>
          <h3>Total Revenue</h3>
          <div className="stat-value">{formatCurrency(stats.revenue)}</div>
          <div className="stat-change">All time</div>
        </div>
        
        <div className="stat-card">
          <i className="fas fa-star"></i>
          <h3>Popular Item</h3>
          <div className="stat-value">{stats.mostPopularItem}</div>
          <div className="stat-change">Most ordered</div>
        </div>
      </div>

      {/* Store Summary */}
      <div className="daily-summary">
        <div className="summary-card">
          <div className="summary-header">
            <h3>Your Stores</h3>
            <button className="btn btn-sm btn-outline" onClick={() => navigate("/vendor/store")}>
              <i className="fas fa-external-link-alt"></i>
              <span>Manage</span>
            </button>
          </div>
          <div className="summary-body">
            {stores.length > 0 ? (
              <ul className="summary-list">
                {stores.map((store) => (
                  <li key={store.store_id}>
                    <div className="store-summary-item">
                      <span className="store-name">{store.name}</span>
                      <span className="store-type">{store.store_type}</span>
                    </div>
                    <div className="store-item-count">
                      <span>{store.items?.length || 0} items</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state text-center py-md">
                <i className="fas fa-store"></i>
                <p>No stores found. Create a store to get started.</p>
                <button className="btn btn-primary mt-sm" onClick={() => navigate("/vendor/store")}>
                  <i className="fas fa-plus"></i>
                  <span>Create Store</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-header">
            <h3>Recent Orders</h3>
            <button className="btn btn-sm btn-outline" onClick={() => navigate("/vendor/orders")}>
              <i className="fas fa-external-link-alt"></i>
              <span>View All</span>
            </button>
          </div>
          <div className="summary-body">
            {orders.length > 0 ? (
              <ul className="summary-list">
                {orders.slice(0, 5).map((order) => (
                  <li key={order.order_id}>
                    <div className="order-summary-item">
                      <span className="order-id">{order.order_id.substring(0, 8)}...</span>
                      <span className={`order-status status-${order.order_status?.toLowerCase()}`}>
                        {order.order_status}
                      </span>
                    </div>
                    <div className="order-price">
                      {formatCurrency(order.total_price)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state text-center py-md">
                <i className="fas fa-shopping-cart"></i>
                <p>No orders yet. They will appear here when customers place orders.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="vendor-section">
        <h3 className="vendor-section-title">Quick Actions</h3>
        <div className="quick-actions">
          <button className="btn btn-primary" onClick={() => navigate("/vendor/add-inventory")}>
            <i className="fas fa-plus-circle"></i>
            <span>Add Inventory</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/vendor/orders")}>
            <i className="fas fa-clipboard-list"></i>
            <span>Manage Orders</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/vendor/store")}>
            <i className="fas fa-store"></i>
            <span>Manage Stores</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;