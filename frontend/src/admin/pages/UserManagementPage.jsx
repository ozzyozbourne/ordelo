import React, { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token") || "";

    fetch(`http://localhost:8080/admin/users`, {
      method: "GET", 
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Unauthorized or failed to fetch users");
        }
        return response.json();
      })
      .then(data => setUsers(data.users))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="admin-page-header">
        <h1>User Management</h1>
      </div>

      {loading && <LoadingSpinner message="Loading users..." />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <table>
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
                <td>
                  <button 
                    onClick={() => handleDelete(user._id, user.name)}
                    className="btn btn-danger btn-sm"
                  >
                    <i className="fas fa-trash"></i> Delete
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

export default UserManagementPage;
