// src/data/mockAuthData.js
export const mockUsers = [
    {
      id: "u1",
      name: "Test User",
      email: "user@example.com",
      password: "password123", // In a real app, passwords would be hashed
      role: "user",
      phone: "555-123-4567",
      address: "123 Main St, Anytown, CA 12345",
      bio: "Food enthusiast and home chef."
    },
    {
      id: "v1",
      name: "Test Vendor",
      email: "vendor@example.com",
      password: "password123",
      role: "vendor",
      phone: "555-987-6543",
      address: "456 Market Ave, Anytown, CA 12345",
      storeName: "Fresh Organics",
      storeAddress: "456 Market Ave, Anytown, CA 12345",
      storeDescription: "Local organic produce and artisanal food products."
    },
    {
      id: "a1",
      name: "Admin User",
      email: "admin@ordelo.com",
      password: "password",
      role: "admin"
    }
  ];
  
  // Pending vendor applications
  export const pendingVendors = [
    // This will be populated when vendors register
  ];
  
  // Password reset requests
  export const passwordResetRequests = [
    // This will be populated when users request password resets
  ];
  
  // Mock authentication functions
  export const mockLogin = (email, password) => {
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (user) {
      // Create a copy without the password for security
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        token: `mock-token-${user.id}-${Date.now()}`
      };
    }
    return null;
  };
  
  export const mockRegisterUser = (userData) => {
    // Check if email already exists
    if (mockUsers.some(u => u.email === userData.email)) {
      return { error: "Email already in use" };
    }
    
    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      ...userData,
      role: "user"
    };
    
    // Add to mock database
    mockUsers.push(newUser);
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return {
      ...userWithoutPassword,
      token: `mock-token-${newUser.id}-${Date.now()}`
    };
  };
  
  export const mockRegisterVendor = (vendorData) => {
    // Create new pending vendor application
    const newVendor = {
      id: `vendor-application-${Date.now()}`,
      ...vendorData,
      applicationDate: new Date().toISOString(),
      status: "pending"
    };
    
    // Add to pending applications
    pendingVendors.push(newVendor);
    
    return { success: true };
  };
  
  export const mockRequestPasswordReset = (email) => {
    // Check if user exists
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      // Still return success for security reasons
      return { success: true };
    }
    
    // Create password reset request
    const request = {
      email,
      token: `reset-${Date.now()}`,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
    
    passwordResetRequests.push(request);
    
    return { success: true };
  };