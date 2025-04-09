// src/pages/admin/VendorManagementPage.jsx
import React, { useEffect, useState } from 'react';
import ErrorMessage from '../../components/admin/ErrorMessage';
import LoadingSpinner from '../../components/admin/LoadingSpinner';
import { mockVendors } from '../../data/mockData'; // Import mock data

const VendorManagementPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // State for status filter

  // Simulate loading mock data
  useEffect(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      try {
        setVendors(mockVendors);
      } catch (err) {
        setError("Failed to load vendors.");
        setVendors([]);
      } finally {
        setLoading(false);
      }
    }, 600); // Simulate delay

    return () => clearTimeout(timer);
  }, []);

  // --- Action Handlers ---
  const handleApprove = (vendorId, vendorName) => {
    console.log(`ACTION: Approve vendor requested: ID=${vendorId}, Name=${vendorName}`);
    alert(`(Frontend Demo) Request to APPROVE vendor "${vendorName}" (ID: ${vendorId}). Check console.`);
    // Later: Call API, then update state or refresh list
    // Example optimistic update:
    // setVendors(current => current.map(v =>
    //    v._id === vendorId ? { ...v, vendorInfo: { ...v.vendorInfo, status: 'approved' } } : v
    // ));
  };

  const handleReject = (vendorId, vendorName) => {
    console.log(`ACTION: Reject vendor requested: ID=${vendorId}, Name=${vendorName}`);
    alert(`(Frontend Demo) Request to REJECT vendor "${vendorName}" (ID: ${vendorId}). Check console.`);
    // Later: Call API, then update state or refresh list
     // Example optimistic update:
    // setVendors(current => current.map(v =>
    //    v._id === vendorId ? { ...v, vendorInfo: { ...v.vendorInfo, status: 'rejected' } } : v
    // ));
  };

   const handleViewDetails = (vendorId, vendorName) => {
     console.log(`ACTION: View vendor details: ID=${vendorId}, Name=${vendorName}`);
     alert(`(Frontend Demo) Request to VIEW details for vendor "${vendorName}" (ID: ${vendorId}). Check console.`);
     // Later: Open a modal or navigate to a detail page
   };

  // --- Filtering Logic ---
  const filteredVendors = vendors.filter(vendor => {
    const vendorName = vendor.vendorInfo?.storeName || vendor.user?.name || '';
    const contactEmail = vendor.user?.email || '';
    const status = vendor.vendorInfo?.status || 'pending'; // Default to pending if undefined

    const matchesSearch =
      vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // --- Render Logic ---
  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <h1>Vendor Management</h1>
        {/* Optional: Add Invite Vendor Button */}
        {/* <button className="btn btn-primary">Invite Vendor</button> */}
      </div>

      {/* Controls: Search and Filter */}
      <div className="admin-controls">
        <input
          type="text"
          placeholder="Search by store name or email..."
          className="admin-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
            className="admin-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
        >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && <LoadingSpinner message="Loading vendors..." />}

      {/* Error State */}
      {error && <ErrorMessage message={error} />}

      {/* Content: Table or No Data Message */}
      {!loading && !error && (
        <div className="admin-table-container">
          <table className="admin-table">
             <thead>
               <tr>
                 <th>Store Name</th>
                 <th>Contact Email</th>
                 <th>Status</th>
                 <th>Applied On</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               {filteredVendors.length > 0 ? (
                 filteredVendors.map(vendor => {
                   // Safely access nested properties
                   const storeName = vendor.vendorInfo?.storeName || vendor.user?.name || 'N/A';
                   const contactEmail = vendor.user?.email || 'N/A';
                   const status = vendor.vendorInfo?.status || 'pending';
                   const applicationDate = vendor.vendorInfo?.applicationDate;

                   return (
                     <tr key={vendor._id}>
                       <td>{storeName}</td>
                       <td>{contactEmail}</td>
                       <td>
                         <span className={`status-badge status-${status}`}>
                           {status}
                         </span>
                       </td>
                       <td>{applicationDate ? new Date(applicationDate).toLocaleDateString() : 'N/A'}</td>
                       <td className="admin-table-actions">
                          <button
                             onClick={() => handleViewDetails(vendor._id, storeName)}
                             className="btn btn-light btn-sm"
                             title="View Details"
                          >
                             <i className="fas fa-eye"></i>
                           </button>
                         {status === 'pending' && (
                           <>
                             <button
                                onClick={() => handleApprove(vendor._id, storeName)}
                                className="btn btn-primary btn-sm"
                                title="Approve Vendor"
                             >
                               <i className="fas fa-check"></i>
                             </button>
                             <button
                                onClick={() => handleReject(vendor._id, storeName)}
                                className="btn btn-danger btn-sm"
                                title="Reject Vendor"
                             >
                               <i className="fas fa-times"></i>
                             </button>
                           </>
                         )}
                         {/* Optional: Add Edit/Delete if needed */}
                       </td>
                     </tr>
                   );
                 })
               ) : (
                 <tr>
                   <td colSpan="5" style={{ textAlign: 'center' }}>
                     <div className="no-data-message">
                       <i className="fas fa-info-circle"></i> No vendors found{searchTerm || statusFilter ? ' matching your criteria' : ''}.
                     </div>
                   </td>
                 </tr>
               )}
             </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorManagementPage;