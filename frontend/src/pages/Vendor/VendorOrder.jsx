import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const VendorOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const [expandedRows, setExpandedRows] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/vendor/orders", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      const orderList = data.value || [];
      
      // Sort orders by date (assuming newest first)
      orderList.sort((a, b) => {
        return new Date(b.order_date || b.created_at || 0) - new Date(a.order_date || a.created_at || 0);
      });
      
      setOrders(orderList);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (order, newStatus) => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/vendor/userorder/accept", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          order_id: order.order_id,
          user_id: order.user_id,
          order_status: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update order status");
      }

      // Update the local state immediately
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.order_id === order.order_id
            ? { ...o, order_status: newStatus }
            : o
        )
      );
      
      // Close the modal if open
      if (showModal) {
        setShowModal(false);
      }
      
      // Show success message
      setSuccess(`Order ${order.order_id.substring(0, 8)}... has been marked as ${newStatus}.`);
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(`Error updating order status: ${err.message}`);
      console.error("Error updating order status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleFilter = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleSort = (e) => {
    setSortBy(e.target.value);
  };

  const toggleRow = (orderId) => {
    setExpandedRows((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Apply filters and sorting
  const filteredOrders = orders.filter(order => {
    if (filterStatus === "all") return true;
    return order.order_status?.toLowerCase() === filterStatus.toLowerCase();
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "date-asc":
        return new Date(a.order_date || a.created_at || 0) - new Date(b.order_date || b.created_at || 0);
      case "date-desc":
        return new Date(b.order_date || b.created_at || 0) - new Date(a.order_date || a.created_at || 0);
      case "price-asc":
        return parseFloat(a.total_price || 0) - parseFloat(b.total_price || 0);
      case "price-desc":
        return parseFloat(b.total_price || 0) - parseFloat(a.total_price || 0);
      default:
        return new Date(b.order_date || b.created_at || 0) - new Date(a.order_date || a.created_at || 0);
    }
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="vendor-container">
      <div className="action-bar">
        <h2 className="page-title">Orders</h2>
        <button className="btn btn-primary" onClick={fetchOrders}>
          <i className="fas fa-sync-alt"></i>
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
        </div>
      )}

      {/* Filter Controls */}
      <div className="vendor-order-filters">
        <div className="order-filter-group">
          <label htmlFor="filter-status">Status:</label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={handleFilter}
            className="filter-select"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
        
        <div className="order-filter-group">
          <label htmlFor="sort-by">Sort By:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={handleSort}
            className="filter-select"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="price-asc">Price: Low to High</option>
          </select>
        </div>
        
        <div className="order-search">
          <input 
            type="text" 
            placeholder="Search orders..." 
            className="search-input"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="vendor-section">
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Items</th>
                <th>Total Price</th>
                <th>Delivery Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length > 0 ? (
                sortedOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td>
                      <span className="order-id">{order.order_id.substring(0, 12)}...</span>
                    </td>
                    <td>
                      {order.items && order.items.length > 0 ? (
                        expandedRows.includes(order.order_id) ? (
                          <div className="order-items-expanded-list">
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {order.items.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: 2 }}>
                                  {item.name} ({item.unit_quantity})
                                </li>
                              ))}
                            </ul>
                            <span
                              style={{ color: 'var(--primary-color)', cursor: 'pointer', marginLeft: 8, fontWeight: 500 }}
                              onClick={() => toggleRow(order.order_id)}
                            >
                              Show less
                            </span>
                          </div>
                        ) : (
                          <span
                            style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 500 }}
                            onClick={() => toggleRow(order.order_id)}
                          >
                            {order.items.length} items
                          </span>
                        )
                      ) : (
                        "No items found"
                      )}
                    </td>
                    <td>{formatCurrency(order.total_price || 0)}</td>
                    <td>{order.delivery_method || "Not specified"}</td>
                    <td>
                      <span className={`order-status status-${order.order_status?.toLowerCase()}`}>
                        {order.order_status || "Unknown"}
                      </span>
                    </td>
                    <td>
                      <div className="order-actions">
                        <button
                          className="order-btn order-btn-view"
                          onClick={() => handleViewOrder(order)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        {(order.order_status === "Pending" || order.order_status === "pending") && (
                          <>
                            <button
                              className="order-btn order-btn-accept"
                              onClick={() => updateStatus(order, "Accepted")}
                              disabled={loading}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              className="order-btn order-btn-reject"
                              onClick={() => updateStatus(order, "Rejected")}
                              disabled={loading}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        )}
                        {order.order_status === "Accepted" && (
                          <button
                            className="order-btn order-btn-deliver"
                            onClick={() => updateStatus(order, "Delivered")}
                            disabled={loading}
                          >
                            <i className="fas fa-truck"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    <div className="empty-state">
                      <i className="fas fa-inbox"></i>
                      <h3>No orders found</h3>
                      <p>
                        {filterStatus !== "all"
                          ? `No ${filterStatus} orders available.`
                          : "You don't have any orders yet. They will appear here when customers place them."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="order-details-modal" onClick={e => e.stopPropagation()}>
            <div className="order-details-header">
              <h3>Order Details</h3>
              <button className="order-details-close" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="order-details-content">
              <div className="order-details-section">
                <h4>Order Information</h4>
                <div className="order-details-grid">
                  <div className="order-details-label">Order ID:</div>
                  <div className="order-details-value">{selectedOrder.order_id}</div>
                  
                  <div className="order-details-label">Status:</div>
                  <div className="order-details-value">
                    <span className={`order-status status-${selectedOrder.order_status?.toLowerCase()}`}>
                      {selectedOrder.order_status || "Unknown"}
                    </span>
                  </div>
                  
                  <div className="order-details-label">Delivery Method:</div>
                  <div className="order-details-value">{selectedOrder.delivery_method || "Not specified"}</div>
                  
                  <div className="order-details-label">Customer ID:</div>
                  <div className="order-details-value">{selectedOrder.user_id || "Anonymous"}</div>
                </div>
              </div>
              
              <div className="order-details-section">
                <h4>Order Items</h4>
                <ul className="order-items-list">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <li key={index}>
                        <div className="order-item-details">
                          <div className="order-item-image"></div>
                          <div>
                            <div className="order-item-name">{item.name}</div>
                            <div className="order-item-quantity">
                              {item.unit_quantity} {item.unit}
                            </div>
                          </div>
                        </div>
                        <div className="order-item-price">{formatCurrency(item.price || 0)}</div>
                      </li>
                    ))
                  ) : (
                    <li className="empty-state text-center py-sm">No items found in this order</li>
                  )}
                </ul>
                
                <div className="order-total">
                  <div>Total:</div>
                  <div>{formatCurrency(selectedOrder.total_price || 0)}</div>
                </div>
              </div>
              
              <div className="order-details-actions">
                {(selectedOrder.order_status === "Pending" || selectedOrder.order_status === "pending") && (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => updateStatus(selectedOrder, "Accepted")}
                      disabled={loading}
                    >
                      {loading ? <div className="spinner"></div> : <><i className="fas fa-check"></i> Accept</>}
                    </button>
                    <button
                      className="btn btn-accent"
                      onClick={() => updateStatus(selectedOrder, "Rejected")}
                      disabled={loading}
                    >
                      {loading ? <div className="spinner"></div> : <><i className="fas fa-times"></i> Reject</>}
                    </button>
                  </>
                )}
                {selectedOrder.order_status === "Accepted" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => updateStatus(selectedOrder, "Delivered")}
                    disabled={loading}
                  >
                    {loading ? <div className="spinner"></div> : <><i className="fas fa-truck"></i> Mark as Delivered</>}
                  </button>
                )}
                <button className="btn btn-secondary" onClick={handleCloseModal}>
                  <i className="fas fa-times"></i> Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrder;