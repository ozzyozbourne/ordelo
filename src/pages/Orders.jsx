import { useState } from "react";
import { Link } from "react-router-dom";

function Orders() {
  // Sample orders data (in a real app, this would come from an API/context)
  const [orders] = useState([
    {
      id: "ORD-12345",
      date: "2025-03-01",
      status: "Delivered",
      total: 45.67,
      items: [
        { name: "Fresh Vegetables Pack", quantity: 1, price: 12.99 },
        { name: "Organic Chicken Breast", quantity: 2, price: 15.99 },
        { name: "Italian Pasta", quantity: 1, price: 3.49 }
      ]
    },
    {
      id: "ORD-12346",
      date: "2025-02-25",
      status: "Processing",
      total: 32.45,
      items: [
        { name: "Mixed Berries", quantity: 1, price: 8.99 },
        { name: "Whole Grain Bread", quantity: 1, price: 4.49 },
        { name: "Premium Ground Beef", quantity: 1, price: 18.97 }
      ]
    }
  ]);

  const [activeOrder, setActiveOrder] = useState(null);

  const toggleOrderDetails = (orderId) => {
    if (activeOrder === orderId) {
      setActiveOrder(null);
    } else {
      setActiveOrder(orderId);
    }
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">
            <i className="fas fa-box"></i> Your Orders
          </h1>
          <p className="page-description">
            View and track all your orders in one place.
          </p>
        </div>
      </div>

      <div className="container">
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
              <div key={order.id} className="order-card">
                <div 
                  className="order-header"
                  onClick={() => toggleOrderDetails(order.id)}
                >
                  <div className="order-info">
                    <h3 className="order-id">{order.id}</h3>
                    <p className="order-date">
                      <i className="far fa-calendar-alt"></i> {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="order-status-price">
                    <span className={`order-status status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                    <p className="order-price">${order.total.toFixed(2)}</p>
                  </div>
                  
                  <button 
                    className="toggle-details"
                    aria-label={activeOrder === order.id ? "Hide details" : "Show details"}
                  >
                    <i className={`fas fa-chevron-${activeOrder === order.id ? 'up' : 'down'}`}></i>
                  </button>
                </div>
                
                {activeOrder === order.id && (
                  <div className="order-details">
                    <h4 className="details-title">Order Items</h4>
                    <ul className="order-items">
                      {order.items.map((item, index) => (
                        <li key={index} className="order-item">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                          <span className="item-price">${item.price.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="order-actions">
                      <button className="btn btn-secondary">
                        <i className="fas fa-receipt"></i> View Receipt
                      </button>
                      <button className="btn btn-primary">
                        <i className="fas fa-redo"></i> Reorder
                      </button>
                    </div>
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