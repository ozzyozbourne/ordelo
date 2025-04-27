// src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProfilePage() {
  const { user, logout, loading } = useAuth(); // Added loading here
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    bio: ""
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Mock order history data
  const [orders, setOrders] = useState([
    {
      id: "ORD-12345",
      date: "2025-03-01",
      status: "Delivered",
      total: 45.67,
      items: [
        { name: "Fresh Vegetables Pack", quantity: 1, price: 12.99 },
        { name: "Organic Chicken Breast", quantity: 2, price: 15.99 },
        { name: "Italian Pasta", quantity: 1, price: 3.49 }
      ]
    },
    {
      id: "ORD-12346",
      date: "2025-02-25",
      status: "Processing",
      total: 32.45,
      items: [
        { name: "Mixed Berries", quantity: 1, price: 8.99 },
        { name: "Whole Grain Bread", quantity: 1, price: 4.49 },
        { name: "Premium Ground Beef", quantity: 1, price: 18.97 }
      ]
    }
  ]);

  // Fetch user profile data when component mounts
  useEffect(() => {
    // This would be replaced with an actual API call
    // Mock data loading
    setIsLoading(true);
    setTimeout(() => {
      setProfileData({
        name: user?.name || "",
        email: user?.email || "",
        phone: "555-123-4567",
        address: "123 Main St, Anytown, CA 12345",
        bio: "Food enthusiast and home chef."
      });
      setIsLoading(false);
    }, 800);
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // This would be an API call to update profile
      // For now, simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords don't match");
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // This would be an API call to change password
      // For now, simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setError("Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDelete = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setIsLoading(true);
      
      try {
        // This would be an API call to delete account
        // For now, simulate a successful deletion
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Log out the user and redirect to home page
        logout();
        navigate("/");
      } catch (err) {
        setError("Failed to delete account. Please try again.");
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="profile-page">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">Your Profile</h1>
          <p className="page-description">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="container">
        <div className="profile-content">
          {/* Profile Sidebar */}
          <div className="profile-sidebar">
            <div className="profile-avatar">
              <div className="avatar-circle">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h3>{user.name}</h3>
              <p>{user.role}</p>
            </div>

            <div className="profile-tabs">
              <button 
                className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="fas fa-user"></i> Profile Information
              </button>
              <button 
                className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="fas fa-lock"></i> Security
              </button>
              <button 
                className={`profile-tab ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <i className="fas fa-box"></i> Order History
              </button>
              <button 
                className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                <i className="fas fa-heart"></i> Saved Recipes
              </button>
              <button 
                className={`profile-tab ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                <i className="fas fa-sliders-h"></i> Preferences
              </button>
              <button 
                className={`profile-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <i className="fas fa-bell"></i> Notifications
              </button>
            </div>

            <div className="profile-logout">
              <button onClick={logout} className="btn btn-secondary">
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="profile-main">
            {/* Success and error messages */}
            {error && <div className="profile-error">{error}</div>}
            {success && <div className="profile-success">{success}</div>}

            {isLoading && (
              <div className="profile-loading">
                <div className="spinner"></div>
                <p>Loading...</p>
              </div>
            )}

            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Profile Information</h2>
                  <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className="btn btn-primary"
                  >
                    {isEditing ? (
                      <><i className="fas fa-times"></i> Cancel</>
                    ) : (
                      <><i className="fas fa-edit"></i> Edit Profile</>
                    )}
                  </button>
                </div>

                {isEditing ? (
                  <form onSubmit={handleProfileSubmit} className="profile-form">
                    <div className="form-group">
                      <label htmlFor="name">Full Name</label>
                      <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        value={profileData.name} 
                        onChange={handleProfileChange} 
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        value={profileData.email} 
                        onChange={handleProfileChange} 
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input 
                        type="tel" 
                        id="phone" 
                        name="phone" 
                        value={profileData.phone} 
                        onChange={handleProfileChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="address">Address</label>
                      <textarea 
                        id="address" 
                        name="address" 
                        value={profileData.address} 
                        onChange={handleProfileChange} 
                        rows="3"
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label htmlFor="bio">Bio</label>
                      <textarea 
                        id="bio" 
                        name="bio" 
                        value={profileData.bio} 
                        onChange={handleProfileChange} 
                        rows="3"
                        placeholder="Tell us about yourself..."
                      ></textarea>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? (
                          <span className="button-loader"></span>
                        ) : (
                          <><i className="fas fa-save"></i> Save Changes</>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-info">
                    <div className="info-group">
                      <h3>Full Name</h3>
                      <p>{profileData.name}</p>
                    </div>

                    <div className="info-group">
                      <h3>Email Address</h3>
                      <p>{profileData.email}</p>
                    </div>

                    <div className="info-group">
                      <h3>Phone Number</h3>
                      <p>{profileData.phone || 'Not provided'}</p>
                    </div>

                    <div className="info-group">
                      <h3>Address</h3>
                      <p>{profileData.address || 'Not provided'}</p>
                    </div>

                    <div className="info-group">
                      <h3>Bio</h3>
                      <p>{profileData.bio || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Security Settings</h2>
                </div>

                <div className="security-section">
                  <h3>Change Password</h3>
                  <form onSubmit={handlePasswordSubmit} className="profile-form">
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input 
                        type="password" 
                        id="currentPassword" 
                        name="currentPassword" 
                        value={passwordData.currentPassword} 
                        onChange={handlePasswordChange} 
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input 
                        type="password" 
                        id="newPassword" 
                        name="newPassword" 
                        value={passwordData.newPassword} 
                        onChange={handlePasswordChange} 
                        required 
                        minLength="8"
                      />
                      <div className="password-requirements">
                        <small>Password must be at least 8 characters long</small>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input 
                        type="password" 
                        id="confirmPassword" 
                        name="confirmPassword" 
                        value={passwordData.confirmPassword} 
                        onChange={handlePasswordChange} 
                        required 
                      />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? (
                          <span className="button-loader"></span>
                        ) : (
                          <><i className="fas fa-key"></i> Update Password</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="security-section danger-zone">
                  <h3>Danger Zone</h3>
                  <p>Permanently delete your account and all of your data. This action cannot be undone.</p>
                  <button 
                    onClick={handleAccountDelete} 
                    className="btn btn-danger"
                    disabled={isLoading}
                  >
                    <i className="fas fa-trash-alt"></i> Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Order History Tab */}
            {activeTab === 'orders' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Order History</h2>
                </div>

                {orders.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-box-open"></i>
                    <h3>No Orders Yet</h3>
                    <p>You haven't placed any orders yet. Start shopping to place your first order!</p>
                    <Link to="/shopping" className="btn btn-primary">
                      <i className="fas fa-shopping-basket"></i> Shop Now
                    </Link>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map(order => (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <div>
                            <h3>{order.id}</h3>
                            <p>{new Date(order.date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className={`order-status status-${order.status.toLowerCase()}`}>
                              {order.status}
                            </span>
                            <p className="order-price">${order.total.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="order-items">
                          <h4>Items</h4>
                          <ul>
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                <span>{item.name}</span>
                                <span>x{item.quantity}</span>
                                <span>${item.price.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="order-actions">
                          <button className="btn btn-secondary">
                            <i className="fas fa-receipt"></i> View Details
                          </button>
                          <button className="btn btn-primary">
                            <i className="fas fa-redo"></i> Reorder
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Saved Recipes Tab */}
            {activeTab === 'saved' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Saved Recipes</h2>
                </div>
                <div className="saved-recipes-shortcut">
                  <p>View and manage all your saved recipes.</p>
                  <Link to="/saved-recipes" className="btn btn-primary">
                    <i className="fas fa-heart"></i> View All Saved Recipes
                  </Link>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Preferences</h2>
                </div>

                <div className="preferences-section">
                  <h3>Dietary Preferences</h3>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input type="checkbox" /> Vegetarian
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" /> Vegan
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" /> Gluten-Free
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" /> Dairy-Free
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" /> Keto
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" /> Low-Carb
                    </label>
                  </div>
                </div>

                <div className="preferences-section">
                  <h3>Allergies</h3>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input type="checkbox" /> Peanuts
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" /> Tree Nuts
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" /> Shellfish
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" /> Eggs
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" /> Soy
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" /> Wheat
                    </label>
                  </div>
                </div>

                <div className="preferences-section">
                  <h3>Unit Preferences</h3>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input type="radio" name="units" defaultChecked /> Imperial (oz, cups, tsp)
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="units" /> Metric (g, ml, l)
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn btn-primary">
                    <i className="fas fa-save"></i> Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Notification Settings</h2>
                </div>

                <div className="notifications-section">
                  <h3>Email Notifications</h3>
                  <div className="toggle-group">
                    <div className="toggle-item">
                      <div>
                        <h4>Order Updates</h4>
                        <p>Receive emails about your order status</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="toggle-item">
                      <div>
                        <h4>New Recipes</h4>
                        <p>Get notified when new recipes matching your preferences are added</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="toggle-item">
                      <div>
                        <h4>Promotions</h4>
                        <p>Receive promotional offers and discounts</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="toggle-item">
                      <div>
                        <h4>Newsletter</h4>
                        <p>Subscribe to our weekly newsletter</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn btn-primary">
                    <i className="fas fa-save"></i> Save Notification Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;