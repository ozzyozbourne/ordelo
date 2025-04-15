// src/pages/admin/IngredientManagementPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import ErrorMessage from '../../components/admin/ErrorMessage';
import LoadingSpinner from '../../components/admin/LoadingSpinner';
// Import density map and updated mock data
import { mockIngredientDensities, mockIngredients } from '../../data/mockData';
// Import updated converter and new findDensity helper
import { convertToStandard, findDensity, unitsByType } from '../../utils/unitConverter';

const IngredientManagementPage = () => {
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- NEW: State for editing ---
    const [editingIngredientId, setEditingIngredientId] = useState(null); // null for add mode, ID for edit mode

    // --- Form State ---
    const initialFormState = { name: '', amount: '', unit: '', type: 'solid' };
    const [formState, setFormState] = useState(initialFormState);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Ref for scrolling to form on edit
    const formRef = useRef(null);

    // --- Fetch Initial Data ---
    useEffect(() => {
        setLoading(true);
        setError(null);
        const timer = setTimeout(() => {
            try {
                // Load ingredients (ensure they have originalAmount/Unit now)
                setIngredients(mockIngredients);
            } catch (err) {
                setError("Failed to load ingredients.");
                setIngredients([]);
            } finally {
                setLoading(false);
            }
        }, 500); // Simulate delay

        return () => clearTimeout(timer);
    }, []);

    // --- Form Handling ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prevState => {
            const newState = { ...prevState, [name]: value };
            // Reset unit if type changes
            if (name === 'type') {
                newState.unit = unitsByType[value]?.[0]?.value || ''; // Default to first unit or empty
            }
            return newState;
        });
        // Clear messages on input change
        setFormError('');
        setFormSuccess('');
    };

    // --- Combined Add/Update Handler ---
    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        const { name, amount, unit, type } = formState;
        const trimmedName = name.trim();

        // Basic Validation
        if (!trimmedName || !amount || !unit || !type) {
            setFormError("All fields (Name, Amount, Unit, Type) are required.");
            return;
        }
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setFormError("Please enter a valid positive number for the amount.");
            return;
        }

        // --- Density Lookup for Solid Volume Units ---
        let density = null;
        const requiresDensity = type === 'solid' && ['cup', 'tsp', 'tbsp'].includes(unit);
        if (requiresDensity) {
            density = findDensity(trimmedName, mockIngredientDensities);
            if (density === null) {
                setFormError(`Cannot convert '${unit}' to grams for "${trimmedName}". Density not found in our records. Please use a weight unit (g, kg, lb, oz) or add density info.`);
                return;
            }
             console.log(`Using density ${density} g/ml for ${trimmedName}`);
        }

        // Perform conversion
        const conversionResult = convertToStandard(numericAmount, unit, type, density);

        if (conversionResult.error) {
            setFormError(`Conversion Error: ${conversionResult.error}`);
            return;
        }

        // --- Logic for Add vs Update ---
        if (editingIngredientId) {
            // --- UPDATE ---
            const updatedIngredient = {
                 _id: editingIngredientId, // Keep the same ID
                 name: trimmedName,
                 type: type,
                 standardAmount: conversionResult.standardAmount,
                 standardUnit: conversionResult.standardUnit,
                 originalAmount: numericAmount, // Store the entered amount/unit
                 originalUnit: unit,
                 // Keep createdAt, or update an 'updatedAt' field if you add one
                 createdAt: ingredients.find(ing => ing._id === editingIngredientId)?.createdAt || new Date().toISOString(),
            };

            // --- Mock Backend Update ---
            console.log("Updating Ingredient (Simulated):", updatedIngredient);
            setIngredients(prevIngredients =>
                prevIngredients.map(ing =>
                    ing._id === editingIngredientId ? updatedIngredient : ing
                )
            );
            setFormSuccess(`Successfully updated "${updatedIngredient.name}".`);
            setEditingIngredientId(null); // Exit edit mode
            setFormState(initialFormState); // Reset form


        } else {
            // --- ADD ---
             // Optional: Check for duplicate name (basic check)
             if (ingredients.some(ing => ing.name.toLowerCase() === trimmedName.toLowerCase())) {
                 setFormError(`An ingredient named "${trimmedName}" already exists.`);
                 return;
             }

            const newIngredient = {
                _id: `ing_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                name: trimmedName,
                type: type,
                standardAmount: conversionResult.standardAmount,
                standardUnit: conversionResult.standardUnit,
                originalAmount: numericAmount, // Store the entered amount/unit
                originalUnit: unit,
                createdAt: new Date().toISOString(),
            };

            // --- Mock Backend Save ---
            console.log("Adding Ingredient (Simulated):", newIngredient);
            setIngredients(prevIngredients => [...prevIngredients, newIngredient]);
            setFormSuccess(`Successfully added "${newIngredient.name}" (${newIngredient.standardAmount} ${newIngredient.standardUnit}).`);
            setFormState(initialFormState); // Reset form
        }
    };

    // --- Edit Handler ---
    const handleEdit = (ingredientId) => {
        const ingredientToEdit = ingredients.find(ing => ing._id === ingredientId);
        if (ingredientToEdit) {
            setEditingIngredientId(ingredientId);
            setFormState({
                name: ingredientToEdit.name,
                // Use original values if available, otherwise fallback might be needed
                amount: ingredientToEdit.originalAmount?.toString() ?? ingredientToEdit.standardAmount?.toString() ?? '',
                unit: ingredientToEdit.originalUnit ?? ingredientToEdit.standardUnit ?? '',
                type: ingredientToEdit.type,
            });
            setFormError(''); // Clear previous errors
            setFormSuccess(''); // Clear previous success message
            // Scroll form into view
            formRef.current?.scrollIntoView({ behavior: 'smooth' });
            console.log(`Editing ingredient: ${ingredientToEdit.name}`);
        } else {
             console.error(`Ingredient with ID ${ingredientId} not found for editing.`);
             setError("Could not find the ingredient to edit."); // Show list-level error
        }
    };

    // --- Cancel Edit Handler ---
    const handleCancelEdit = () => {
        setEditingIngredientId(null);
        setFormState(initialFormState);
        setFormError('');
        setFormSuccess('');
        console.log("Cancelled edit.");
    };

    // --- Delete Handler ---
    const handleDelete = (ingredientId, ingredientName) => {
        console.log(`ACTION: Delete ingredient requested: ID=${ingredientId}, Name=${ingredientName}`);
        if (window.confirm(`Are you sure you want to delete ingredient "${ingredientName}"? This cannot be undone.`)) {
            // --- Mock Backend Delete ---
            setIngredients(currentIngredients => currentIngredients.filter(ing => ing._id !== ingredientId));
            alert(`(Frontend Demo) Deleted ingredient "${ingredientName}" (ID: ${ingredientId}).`);
            // If deleting the ingredient currently being edited, cancel edit mode
            if (editingIngredientId === ingredientId) {
                handleCancelEdit();
            }
        }
    };

    // --- Filtering Logic ---
    const filteredIngredients = ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="admin-page-header">
                <h1>Ingredient Management</h1>
            </div>

            {/* --- Add/Edit Ingredient Form --- */}
            {/* Add ref to the container div */}
            <div ref={formRef} className="add-ingredient-form card-bg" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow-sm)' }}>
                 <h2>{editingIngredientId ? 'Edit Ingredient' : 'Add New Ingredient'}</h2>
                 <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                     {/* Display Form Success/Error Messages */}
                     {formError && <ErrorMessage message={formError} />}
                     {formSuccess && <div className="success-message">{formSuccess}</div>}

                     <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                         <div className="form-group">
                             <label htmlFor="name">Ingredient Name:</label>
                             <input type="text" id="name" name="name" value={formState.name} onChange={handleInputChange} required className="admin-search-input" style={{width: '100%'}}/>
                         </div>
                         <div className="form-group">
                             <label htmlFor="type">Type:</label>
                             <select id="type" name="type" value={formState.type} onChange={handleInputChange} required className="admin-select-filter" style={{width: '100%'}}>
                                 <option value="solid">Solid</option>
                                 <option value="liquid">Liquid</option>
                             </select>
                         </div>
                         <div className="form-group">
                             <label htmlFor="amount">Amount:</label>
                             <input type="number" id="amount" name="amount" value={formState.amount} onChange={handleInputChange} required className="admin-search-input" step="any" min="0.001" placeholder="e.g., 1.5" style={{width: '100%'}}/>
                         </div>
                         <div className="form-group">
                             <label htmlFor="unit">Unit:</label>
                             <select id="unit" name="unit" value={formState.unit} onChange={handleInputChange} required className="admin-select-filter" style={{width: '100%'}} disabled={!formState.type}>
                                 <option value="" disabled>Select Unit</option>
                                 {/* Ensure units update if type changes */}
                                 {unitsByType[formState.type]?.map(u => (
                                     <option key={`${formState.type}-${u.value}`} value={u.value}>{u.label}</option>
                                 ))}
                             </select>
                             {/* Hint for solid volume units */}
                              {formState.type === 'solid' && ['cup', 'tsp', 'tbsp'].includes(formState.unit) && (
                                <small style={{marginTop: '4px', color: 'var(--dark-gray)'}}>Density lookup will be used for grams conversion.</small>
                              )}
                         </div>
                     </div>
                     <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                         <button type="submit" className="btn btn-primary">
                            <i className={`fas ${editingIngredientId ? 'fa-save' : 'fa-plus'}`}></i> {editingIngredientId ? 'Update Ingredient' : 'Add Ingredient'}
                         </button>
                         {/* Show Cancel button only in edit mode */}
                         {editingIngredientId && (
                            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                                <i className="fas fa-times"></i> Cancel Edit
                            </button>
                         )}
                     </div>
                 </form>
            </div>

            {/* --- Ingredient List --- */}
            <h2>Existing Ingredients</h2>
            {/* Display List Loading/Error Messages */}
            {loading && <LoadingSpinner message="Loading ingredients..." />}
            {error && <ErrorMessage message={error} />}

            {!loading && !error && (
              <>
                <div className="admin-controls">
                    <input
                        type="text"
                        placeholder="Search by name..."
                        className="admin-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Input</th> {/* Display original input */}
                                <th>Standard Amount</th>
                                <th>Std. Unit</th> {/* Shortened header */}
                                {/* <th>Created On</th> */}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIngredients.length > 0 ? (
                                filteredIngredients.map(ingredient => (
                                    <tr key={ingredient._id}>
                                        <td>{ingredient.name}</td>
                                        <td>
                                            <span className={`status-badge status-${ingredient.type}`}>
                                                {ingredient.type}
                                            </span>
                                        </td>
                                        {/* Display original input */}
                                        <td>{`${ingredient.originalAmount ?? '?'} ${ingredient.originalUnit ?? '?'}`}</td>
                                        <td>{ingredient.standardAmount}</td>
                                        <td>{ingredient.standardUnit}</td>
                                        {/* <td>{new Date(ingredient.createdAt).toLocaleDateString()}</td> */}
                                        <td className="admin-table-actions">
                                            {/* Pass ingredient ID to handlers */}
                                            <button onClick={() => handleEdit(ingredient._id)} className="btn btn-light btn-sm" title="Edit Ingredient">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button onClick={() => handleDelete(ingredient._id, ingredient.name)} className="btn btn-danger btn-sm" title="Delete Ingredient">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center' }}>
                                        <div className="no-data-message">
                                            <i className="fas fa-info-circle"></i> No ingredients found{searchTerm ? ' matching your criteria' : ''}.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
              </>
            )}
        </div>
    );
};

export default IngredientManagementPage;