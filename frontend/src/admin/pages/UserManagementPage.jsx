import React, { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token") || "";

    try {
      const response = await fetch(`http://localhost:8080/admin/users`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Unauthorized or failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (_id, name) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) return;

    const token = localStorage.getItem("token") || "";

    try {
      const response = await fetch(`http://localhost:8080/admin/user/${_id}?_id=${_id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="user-management">
      <div className="admin-page-header">
        <h1>User Management</h1>
      </div>

      {loading && <LoadingSpinner message="Loading users..." />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.email}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td className="user-actions">
                    <button 
                      onClick={() => handleDelete(user.user_id, user.name)}  
                      className="user-btn user-btn-delete"
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
