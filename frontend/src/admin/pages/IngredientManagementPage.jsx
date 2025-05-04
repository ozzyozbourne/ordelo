import React, { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const IngredientManagementPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch("http://localhost:8080/api/ingredients")
      .then(response => response.json())
      .then(data => setIngredients(data))
      .catch(() => setError("Failed to load ingredients."))
      .finally(() => setLoading(false));
  }, []);

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="admin-page-header">
        <h1>Ingredient Management</h1>
      </div>

      <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

      {loading && <LoadingSpinner message="Loading ingredients..." />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Unit</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.map(ingredient => (
              <tr key={ingredient._id}>
                <td>{ingredient.name}</td>
                <td>{ingredient.type}</td>
                <td>{ingredient.originalAmount}</td>
                <td>{ingredient.originalUnit}</td>
                <td>{new Date(ingredient.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default IngredientManagementPage;
