import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRecipes } from "../context/RecipeContext";
import "../styles/Orders.css";

function Orders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/user/orders', {
          headers: {
            Authorization: `Bearer ${user?.token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data.value || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchOrders();
    }
  }, [user?.token]);

  const toggleOrderDetails = (orderId) => {
    if (activeOrder === orderId) {
      setActiveOrder(null);
    } else {
      setActiveOrder(orderId);
    }
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="error-state">
            <i className="fas fa-exclamation-circle"></i>
            <h2>Error Loading Orders</h2>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-redo"></i> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-hero">
          <div className="orders-hero-content">
            <div className="orders-hero-text">
              <h1 className="orders-hero-title">
                <i className="fas fa-box"></i> Your Orders
              </h1>
              <p className="orders-hero-description">
                View and track all your orders in one place.
              </p>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="empty-orders">
            <div className="empty-state">
              <i className="fas fa-box empty-icon"></i>
              <h2>No Orders Yet</h2>
              <p>
                You haven't placed any orders yet. Start shopping to place your first order!
              </p>
              <Link to="/shopping-list" className="btn btn-primary">
                <i className="fas fa-shopping-basket"></i> Go to Shopping List
              </Link>
            </div>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.order_id} className="order-card">
                <div 
                  className="order-header"
                  onClick={() => toggleOrderDetails(order.order_id)}
                >
                  <div className="order-info">
                    <h3 className="order-id">{order.order_id}</h3>
                    <p className="order-date">
                      <i className="far fa-calendar-alt"></i> {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="order-status-price">
                    <span className={`order-status status-${order.order_status.toLowerCase()}`}>
                      {order.order_status}
                    </span>
                    <p className="order-price">${order.total_price.toFixed(2)}</p>
                  </div>
                  
                  <button 
                    className="toggle-details"
                    aria-label={activeOrder === order.order_id ? "Hide details" : "Show details"}
                  >
                    <i className={`fas fa-chevron-${activeOrder === order.order_id ? 'up' : 'down'}`}></i>
                  </button>
                </div>
                
                {activeOrder === order.order_id && (
                  <div className="order-details">
                    <h4 className="details-title">Order Items</h4>
                    <ul className="order-items">
                      {order.items.map((item, index) => (
                        <li key={index} className="order-item">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">x{item.unit_quantity}</span>
                          <span className="item-price">${item.price?.toFixed(2) || '0.00'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;