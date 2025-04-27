// src/pages/admin/UserManagementPage.jsx
import React, { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { mockUsers } from '../../data/mockData'; // Import mock data

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState(''); // State for role filter

  // Simulate loading mock data
  useEffect(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      try {
        setUsers(mockUsers);
        // Uncomment to simulate error:
        // throw new Error("Simulated database connection error.");
      } catch (err) {
        console.error("Simulated loading error:", err);
        setError(err.message || "Failed to load users.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 500); // Simulate delay

    return () => clearTimeout(timer); // Cleanup timer
  }, []); // Run only on mount

  // --- Action Handlers (Log actions for now) ---
  const handleDelete = (userId, userName) => {
    console.log(`ACTION: Delete user requested: ID=${userId}, Name=${userName}`);
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
       alert(`(Frontend Demo) Deleting user "${userName}" (ID: ${userId}). Check console.`);
       // Later: Call API, then update state:
       // setUsers(currentUsers => currentUsers.filter(u => u._id !== userId));
    }
  };

  const handleEdit = (userId) => {
    console.log(`ACTION: Edit user requested: ID=${userId}`);
    alert(`(Frontend Demo) Request to edit user ID: ${userId}. Check console.`);
    // Later: navigate(`/admin/users/edit/${userId}`) or open modal
  };

   const handleAddUser = () => {
     console.log("ACTION: Add new user requested.");
     alert("(Frontend Demo) Open 'Add User' form/modal.");
     // Later: Navigate or show modal
   }

  // --- Filtering Logic ---
  const filteredUsers = users.filter(user => {
    const nameMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = roleFilter === '' || user.role === roleFilter;

    // Match if search term is in name OR email, AND role matches filter
    return (nameMatch || emailMatch) && roleMatch;
  });

  // --- Render Logic ---
  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <h1>User Management</h1>
        <button className="btn btn-primary" onClick={handleAddUser}>
           <i className="fas fa-plus"></i> Add User
        </button>
      </div>

      {/* Controls: Search and Filter */}
      <div className="admin-controls">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="admin-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="admin-select-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="vendor">Vendor</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && <LoadingSpinner message="Loading users..." />}

      {/* Error State */}
      {error && <ErrorMessage message={error} />}

      {/* Content: Table or No Data Message */}
      {!loading && !error && (
        <div className="admin-table-container">
          <table className="admin-table">
             <thead>
               <tr>
                 <th>Name</th>
                 <th>Email</th>
                 <th>Role</th>
                 <th>Joined</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               {filteredUsers.length > 0 ? (
                 filteredUsers.map(user => (
                   <tr key={user._id}>
                     <td>{user.name}</td>
                     <td>{user.email}</td>
                     <td>
                       {/* Status Badge for Role */}
                       <span className={`status-badge status-${user.role.toLowerCase()}`}>
                         {user.role}
                       </span>
                     </td>
                     {/* Format date nicely */}
                     <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                     <td className="admin-table-actions">
                       <button
                         onClick={() => handleEdit(user._id)}
                         className="btn btn-light btn-sm"
                         title="Edit User"
                       >
                         <i className="fas fa-edit"></i>
                       </button>
                       <button
                         onClick={() => handleDelete(user._id, user.name)}
                         className="btn btn-danger btn-sm"
                         title="Delete User"
                       >
                         <i className="fas fa-trash"></i>
                       </button>
                     </td>
                   </tr>
                 ))
               ) : (
                 // Row shown when no users match filters/search
                 <tr>
                   <td colSpan="5" style={{ textAlign: 'center' }}>
                     <div className="no-data-message">
                       <i className="fas fa-info-circle"></i> No users found{searchTerm || roleFilter ? ' matching your criteria' : ''}.
                     </div>
                   </td>
                 </tr>
               )}
             </tbody>
          </table>
        </div>
      )}
       {/* Future: Add Pagination component here */}
    </div>
  );
};

export default UserManagementPage;