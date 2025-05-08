import React, { useState } from 'react';

const VendorOrder = () => {
  const [orders, setOrders] = useState([
    { id: 1, customer: 'John Doe', item: 'Cake', status: 'Pending' },
    { id: 2, customer: 'Jane Smith', item: 'Flowers', status: 'Pending' },
    { id: 3, customer: 'Shahrukh', item: 'Milk, cream, butter', status: 'Pending' },
    { id: 4, customer: 'Javed', item: 'chips, chocolates', status: 'Pending' },
    { id: 5, customer: 'Akif', item: 'icecream, hookah', status: 'Pending' },
    { id: 6, customer: 'Osaid', item: 'paan leaves ', status: 'Pending' },
  ]);

  const updateStatus = (id, newStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order
      )
    );
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

  const buttonStyle = {
    margin: '0 4px',
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
  };

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
            <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Item</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{order.id}</td>
              <td style={{ padding: '10px' }}>{order.customer}</td>
              <td style={{ padding: '10px' }}>{order.item}</td>
              <td style={{ padding: '10px', ...getStatusStyle(order.status) }}>
                {order.status}
              </td>
              <td style={{ padding: '10px' }}>
                <button
                  style={{ ...buttonStyle, backgroundColor: '#4caf50' }}
                  onClick={() => updateStatus(order.id, 'Accepted')}
                >
                  Accept
                </button>
                <button
                  style={{ ...buttonStyle, backgroundColor: '#f44336' }}
                  onClick={() => updateStatus(order.id, 'Rejected')}
                >
                  Reject
                </button>
                <button
                  style={{ ...buttonStyle, backgroundColor: '#2196f3' }}
                  onClick={() => updateStatus(order.id, 'Delivered')}
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
