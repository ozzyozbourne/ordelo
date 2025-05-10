<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { useAuth } from "/Users/zohaahmed/ordelo/ordelo/frontend/src/context/AuthContext.jsx";

const VendorOrder = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
=======
import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";

const VendorOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
>>>>>>> c7aace2a548e53649aa6ad77e005eb67e023c57a
      const response = await fetch("http://localhost:8080/vendor/orders", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
<<<<<<< HEAD
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      setOrders(data.value || []);
    } catch (err) {
      setError(err.message);
=======

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.value || []);
      console.log(data.value);

    } catch (err) {
      setError(err.message);
      console.error("Error fetching orders:", err);
>>>>>>> c7aace2a548e53649aa6ad77e005eb67e023c57a
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  useEffect(() => {
    if (user?.token) {
      fetchOrders();
    }
  }, [user?.token]);

  const updateOrderStatus = async (order, newStatus) => {
    try {
      const requestBody = {
        order_id: order.order_id,
        user_id: order.user_id,
        order_status: newStatus.toLowerCase()
      };

      // Convert the object to a JSON string using JSON.stringify
=======
  const updateStatus = async (order, newStatus) => {
    try {
>>>>>>> c7aace2a548e53649aa6ad77e005eb67e023c57a
      const response = await fetch("http://localhost:8080/vendor/userorder/accept", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
<<<<<<< HEAD
        body: JSON.stringify(requestBody) // Convert to JSON string
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Unknown error";
        throw new Error(`Failed to update order: ${errorMessage}`);
      }

      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.order_id === order.order_id ? { ...o, order_status: newStatus } : o
        )
      );
    } catch (err) {
      alert("Error updating order: " + err.message);
=======
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

      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
>>>>>>> c7aace2a548e53649aa6ad77e005eb67e023c57a
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      accepted: { color: "green", fontWeight: "bold" },
      rejected: { color: "red", fontWeight: "bold" },
      delivered: { color: "blue", fontWeight: "bold" },
      pending: { color: "orange", fontWeight: "bold" },
    };
    // Use lowercase for consistent comparison
    return styles[status?.toLowerCase()] || {};
  };

<<<<<<< HEAD
  const buttonStyle = {
    margin: "0 4px",
    padding: "4px 8px",
    border: "none",
    borderRadius: "4px",
    color: "white",
    cursor: "pointer",
  };
=======
  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }
>>>>>>> c7aace2a548e53649aa6ad77e005eb67e023c57a

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>
        Orders
      </h3>
<<<<<<< HEAD
      {orders.length === 0 ? (
        <div>No orders found</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Order ID</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Customer</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Items</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
=======
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#fff',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Order ID</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Customer ID</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Store ID</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Items</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Total Price</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Delivery Method</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.order_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{order.order_id}</td>
              <td style={{ padding: '10px' }}>{order.user_id}</td>
              <td style={{ padding: '10px' }}>{order.store_id}</td>
              <td style={{ padding: '10px' }}>
                {order.items.map(item => `${item.name} (${item.unit_quantity})`).join(', ')}
              </td>
              <td style={{ padding: '10px' }}>${order.total_price}</td>
              <td style={{ padding: '10px' }}>{order.delivery_method}</td>
              <td style={{ padding: '10px', ...getStatusStyle(order.order_status) }}>
                {order.order_status}
              </td>
              <td style={{ padding: '10px' }}>
                <button
                  style={{ 
                    margin: '0 4px',
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    backgroundColor: '#4caf50'
                  }}
                  onClick={() => updateStatus(order, 'Accepted')}
                >
                  Accept
                </button>
                <button
                  style={{ 
                    margin: '0 4px',
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    backgroundColor: '#f44336'
                  }}
                  onClick={() => updateStatus(order, 'Rejected')}
                >
                  Reject
                </button>
                <button
                  style={{ 
                    margin: '0 4px',
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    backgroundColor: '#2196f3'
                  }}
                  onClick={() => updateStatus(order.order_id, 'Delivered')}
                >
                  Delivered
                </button>
              </td>
>>>>>>> c7aace2a548e53649aa6ad77e005eb67e023c57a
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px" }}>{order.order_id}</td>
                <td style={{ padding: "10px" }}>{order.customer_name || "N/A"}</td>
                <td style={{ padding: "10px" }}>
                  {order.items && order.items.length > 0
                    ? order.items.map((item) => item.name).join(", ")
                    : "No items"}
                </td>
                <td style={{ padding: "10px", ...getStatusStyle(order.order_status) }}>
                  {order.order_status}
                </td>
                <td style={{ padding: "10px" }}>
                  <button
                    style={{ ...buttonStyle, backgroundColor: "#4caf50" }}
                    onClick={() => updateOrderStatus(order, "accepted")}
                    disabled={order.order_status === "accepted"}
                  >
                    Accept
                  </button>
                  <button
                    style={{ ...buttonStyle, backgroundColor: "#f44336" }}
                    onClick={() => updateOrderStatus(order, "rejected")}
                    disabled={order.order_status === "rejected"}
                  >
                    Reject
                  </button>
                  <button
                    style={{ ...buttonStyle, backgroundColor: "#2196f3" }}
                    onClick={() => updateOrderStatus(order, "delivered")}
                    disabled={order.order_status === "delivered"}
                  >
                    Delivered
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VendorOrder;