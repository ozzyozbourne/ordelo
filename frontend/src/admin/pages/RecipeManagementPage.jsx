// src/pages/admin/RecipeManagementPage.jsx
import React, { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { mockRecipes } from '../../data/mockData'; // Import mock data

const RecipeManagementPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // Filter by status
  const [sourceFilter, setSourceFilter] = useState(''); // Filter by source

  // Simulate loading mock data
  useEffect(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      try {
        setRecipes(mockRecipes);
      } catch (err) {
        setError("Failed to load recipes.");
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }, 700); // Simulate delay

    return () => clearTimeout(timer);
  }, []);

  // --- Action Handlers ---
  const handleDelete = (recipeId, recipeTitle) => {
    console.log(`ACTION: Delete recipe requested: ID=${recipeId}, Title=${recipeTitle}`);
     if (window.confirm(`Are you sure you want to delete recipe "${recipeTitle}"?`)) {
        alert(`(Frontend Demo) Deleting recipe "${recipeTitle}" (ID: ${recipeId}). Check console.`);
        // Later: Call API, then update state:
        // setRecipes(currentRecipes => currentRecipes.filter(r => r._id !== recipeId));
     }
  };

  const handleEdit = (recipeId) => {
    console.log(`ACTION: Edit recipe requested: ID=${recipeId}`);
    alert(`(Frontend Demo) Request to EDIT recipe ID: ${recipeId}. Check console.`);
    // Later: navigate(`/admin/recipes/edit/${recipeId}`) or open modal
  };

   const handleView = (recipeId) => {
     console.log(`ACTION: View recipe requested: ID=${recipeId}`);
     alert(`(Frontend Demo) Request to VIEW recipe ID: ${recipeId}. Check console.`);
     // Later: Open a modal or navigate to a detail page
   };

   const handleAddRecipe = () => {
     console.log("ACTION: Add new recipe requested.");
     alert("(Frontend Demo) Open 'Add Recipe' form/modal.");
     // Later: Navigate or show modal
   }

  // --- Filtering Logic ---
  const filteredRecipes = recipes.filter(recipe => {
    const titleMatch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase());
    const authorMatch = (recipe.author || '').toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === '' || recipe.status === statusFilter;
    const sourceMatch = sourceFilter === '' || recipe.source === sourceFilter;

    return (titleMatch || authorMatch) && statusMatch && sourceMatch;
  });

  // --- Render Logic ---
  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <h1>Recipe Management</h1>
         <button className="btn btn-primary" onClick={handleAddRecipe}>
           <i className="fas fa-plus"></i> Add Internal Recipe
        </button>
      </div>

      {/* Controls: Search and Filters */}
      <div className="admin-controls">
        <input
          type="text"
          placeholder="Search by title or author..."
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
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option> {/* If applicable */}
        </select>
        <select
            className="admin-select-filter"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
        >
            <option value="">All Sources</option>
            <option value="internal">Internal</option>
            <option value="user">User Submitted</option>
            <option value="vendor">Vendor Submitted</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && <LoadingSpinner message="Loading recipes..." />}

      {/* Error State */}
      {error && <ErrorMessage message={error} />}

      {/* Content: Table or No Data Message */}
      {!loading && !error && (
        <div className="admin-table-container">
          <table className="admin-table">
             <thead>
               <tr>
                 <th>Title</th>
                 <th>Author</th>
                 <th>Status</th>
                 <th>Source</th>
                 <th>Created On</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               {filteredRecipes.length > 0 ? (
                 filteredRecipes.map(recipe => {
                   const status = recipe.status || 'draft';
                   const source = recipe.source || 'internal';
                   return (
                     <tr key={recipe._id}>
                       <td>{recipe.title}</td>
                       <td>{recipe.author || 'N/A'}</td>
                       <td>
                         <span className={`status-badge status-${status}`}>
                           {status}
                         </span>
                       </td>
                       <td>
                         <span className={`status-badge status-${source}`}>
                            {source}
                         </span>
                       </td>
                       <td>{new Date(recipe.createdAt).toLocaleDateString()}</td>
                       <td className="admin-table-actions">
                         <button onClick={() => handleView(recipe._id)} className="btn btn-light btn-sm" title="View Recipe">
                           <i className="fas fa-eye"></i>
                         </button>
                          <button onClick={() => handleEdit(recipe._id)} className="btn btn-light btn-sm" title="Edit Recipe">
                           <i className="fas fa-edit"></i>
                         </button>
                         <button onClick={() => handleDelete(recipe._id, recipe.title)} className="btn btn-danger btn-sm" title="Delete Recipe">
                           <i className="fas fa-trash"></i>
                         </button>
                         {/* Add Approve/Reject buttons if moderation needed */}
                       </td>
                     </tr>
                   );
                 })
               ) : (
                 <tr>
                   <td colSpan="6" style={{ textAlign: 'center' }}>
                     <div className="no-data-message">
                       <i className="fas fa-info-circle"></i> No recipes found{searchTerm || statusFilter || sourceFilter ? ' matching your criteria' : ''}.
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

export default RecipeManagementPage;