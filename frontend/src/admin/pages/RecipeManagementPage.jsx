import React, { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const RecipeManagementPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch("http://localhost:8080/api/recipes")
      .then(response => response.json())
      .then(data => setRecipes(data))
      .catch(() => setError("Failed to load recipes."))
      .finally(() => setLoading(false));
  }, []);

  const filteredRecipes = recipes.filter(recipe =>
    (recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (recipe.author || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === '' || recipe.status === statusFilter) &&
    (sourceFilter === '' || recipe.source === sourceFilter)
  );

  return (
    <div>
      <div className="admin-page-header">
        <h1>Recipe Management</h1>
      </div>

      <div className="admin-controls">
        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="">All Sources</option>
          <option value="internal">Internal</option>
          <option value="user">User Submitted</option>
          <option value="vendor">Vendor Submitted</option>
        </select>
      </div>

      {loading && <LoadingSpinner message="Loading recipes..." />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Source</th>
              <th>Created On</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecipes.map(recipe => (
              <tr key={recipe._id}>
                <td>{recipe.title}</td>
                <td>{recipe.author || 'N/A'}</td>
                <td>{recipe.status}</td>
                <td>{recipe.source}</td>
                <td>{new Date(recipe.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecipeManagementPage;
