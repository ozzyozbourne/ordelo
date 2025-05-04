import React, { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const VendorManagementPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch("http://localhost:8080/api/vendors")
      .then(response => response.json())
      .then(data => setVendors(data))
      .catch(() => setError("Failed to load vendors."))
      .finally(() => setLoading(false));
  }, []);

  const filteredVendors = vendors.filter(vendor => {
    const vendorName = vendor.vendorInfo?.storeName || vendor.user?.name || '';
    const contactEmail = vendor.user?.email || '';
    const status = vendor.vendorInfo?.status || 'pending';

    return (
      (vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactEmail.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === '' || status === statusFilter)
    );
  });

  return (
    <div>
      <div className="admin-page-header">
        <h1>Vendor Management</h1>
      </div>

      <div className="admin-controls">
        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading && <LoadingSpinner message="Loading vendors..." />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Store Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Applied On</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map(vendor => (
              <tr key={vendor._id}>
                <td>{vendor.vendorInfo?.storeName || vendor.user?.name}</td>
                <td>{vendor.user?.email}</td>
                <td>{vendor.vendorInfo?.status}</td>
                <td>{vendor.vendorInfo?.applicationDate ? new Date(vendor.vendorInfo.applicationDate).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VendorManagementPage;
