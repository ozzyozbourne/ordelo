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
      const response = await fetch("http://localhost:8080/vendor/orders", {
        headers: {
          Authorization: Bearer ${user?.token},
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.value || []);
      console.log(data.value);

    } catch (err) {
      setError(err.message);
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (order, newStatus) => {
    try {
      const response = await fetch("http://localhost:8080/vendor/userorder/accept", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: Bearer ${user?.token},
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

      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      Accepted: { color: 'green', fontWeight: 'bold' },
      Rejected: { color: 'red', fontWeight: 'bold' },
      Delivered: { color: 'blue', fontWeight: 'bold' },
      Pending: { color: 'orange', fontWeight: 'bold' },
    };
    return styles[status] || {};
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
        Orders
      </h3>
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
                {order.items.map(item => ${item.name} (${item.unit_quantity})).join(', ')}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VendorOrder;