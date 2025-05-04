import React, { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const VendorManagementPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token") || "";

    fetch("http://localhost:8080/admin/vendors", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Unauthorized or failed to fetch vendors");
        }
        return response.json();
      })
      .then(data => setVendors(data.vendors))
      .catch(() => setError("Failed to load vendors."))
      .finally(() => setLoading(false));
  }, []);

  const filteredVendors = vendors.filter(vendor => {
    const vendorName = vendor.name || '';
    const storeName = vendor.stores?.[0]?.name || '';
    const address = vendor.address || '';
    const email = vendor.email || '';

    return (
      vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div>
      <div className="admin-page-header">
        <h1>Vendor Management</h1>
      </div>

      <div className="admin-controls">
        <input 
          type="text" 
          placeholder="Search by vendor name, store name, address or email..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
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
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map(vendor => (
              <tr key={vendor.user_id}>
                <td>{vendor.name || 'N/A'}</td>
                <td>{vendor.stores?.[0]?.name || 'N/A'}</td>
                <td>{vendor.address || 'N/A'}</td>
                <td>{vendor.email || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VendorManagementPage;
