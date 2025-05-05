import React, { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const VendorManagementPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token") || "";

    try {
      const response = await fetch("http://localhost:8080/admin/vendors", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Unauthorized or failed to fetch vendors");
      }

      const data = await response.json();
      console.log(data);
    } catch (err) {
      setError("Failed to load vendors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleDelete = async (_id, name) => {
    if (!window.confirm(`Are you sure you want to remove vendor "${name}"?`)) return;

    const token = localStorage.getItem("token") || "";

    try {
      const response = await fetch(`http://localhost:8080/admin/vendor/${_id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete vendor");
      }

      fetchVendors();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Vendor Management</h1>
      </div>

      {loading && <LoadingSpinner message="Loading vendors..." />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Store Name</th>
              <th>Address</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(vendor => (
              <tr key={vendor.email}>
                <td>{vendor.name || 'N/A'}</td>
                <td>{vendor.stores?.[0]?.name || 'N/A'}</td>
                <td>{vendor.address || 'N/A'}</td>
                <td>{vendor.email || 'N/A'}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(vendor.user_id, vendor.name)} 
                    className="btn btn-danger btn-sm"
                  >
                    <i className="fas fa-trash"></i> Remove
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

export default VendorManagementPage;
