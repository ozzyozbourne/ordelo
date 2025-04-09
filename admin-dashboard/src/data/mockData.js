// src/data/mockData.js

export const mockUsers = [
    { _id: 'u1', name: 'Alice Admin', email: 'alice@example.com', role: 'admin', createdAt: '2023-01-15T10:00:00Z' },
    { _id: 'u2', name: 'Bob User', email: 'bob@example.com', role: 'user', createdAt: '2023-02-20T11:30:00Z' },
    { _id: 'u3', name: 'Charlie Vendor', email: 'charlie@example.com', role: 'vendor', createdAt: '2023-03-10T09:15:00Z' },
    { _id: 'u4', name: 'Diana Developer', email: 'diana@example.com', role: 'user', createdAt: '2023-04-05T14:00:00Z' },
    { _id: 'u5', name: 'Ethan Editor', email: 'ethan@example.com', role: 'user', createdAt: '2023-05-22T16:45:00Z' },
    { _id: 'u6', name: 'Fiona Vendor', email: 'fiona@example.com', role: 'vendor', createdAt: '2023-06-18T08:00:00Z' },
    { _id: 'u7', name: 'George Guest', email: 'george@example.com', role: 'user', createdAt: '2023-07-01T12:00:00Z'},
    { _id: 'u8', name: 'Hannah Helper', email: 'hannah@example.com', role: 'user', createdAt: '2023-08-11T13:10:00Z'},
  ];
  
  // Find user objects to link (ensure IDs match mockUsers)
  const findUser = (id) => mockUsers.find(u => u._id === id);
  
  export const mockVendors = [
    {
      _id: 'v1', // Vendor ID
      user: findUser('u3'), // Linked user object
      vendorInfo: {
        storeName: "Charlie's Fresh Produce",
        status: 'approved', // 'pending', 'approved', 'rejected'
        applicationDate: '2023-03-01T10:00:00Z',
        // Add other vendor specific details if needed
      }
    },
     {
      _id: 'v2',
      user: findUser('u6'),
      vendorInfo: {
        storeName: "Fiona's Fine Foods",
        status: 'pending',
        applicationDate: '2023-06-15T11:00:00Z',
      }
    },
    {
      _id: 'v3',
      user: { _id: 'u9', name: 'New Applicant', email: 'new@vend.co', role: 'vendor', createdAt: '2023-09-01T00:00:00Z'}, // Simulate user not in main list yet
      vendorInfo: {
         storeName: "Applicant Store",
         status: 'pending',
         applicationDate: '2023-09-01T10:00:00Z',
      }
    },
  ];
  
  export const mockRecipes = [
    { _id: 'r1', title: "Admin's Special Pasta Bake", author: 'Alice Admin', status: 'published', createdAt: '2023-01-20T12:00:00Z', source: 'internal' },
    { _id: 'r2', title: "User Submitted Chicken Curry", author: 'Bob User', status: 'draft', createdAt: '2023-02-25T15:00:00Z', source: 'user' },
    { _id: 'r3', title: "Vendor's Secret Beef Stew", author: "Charlie's Fresh Produce", status: 'published', createdAt: '2023-03-15T10:30:00Z', source: 'vendor' },
    { _id: 'r4', title: "Quick Weeknight Noodles", author: 'Alice Admin', status: 'published', createdAt: '2023-04-10T11:00:00Z', source: 'internal' },
    { _id: 'r5', title: "Healthy Veggie Salad", author: 'Diana Developer', status: 'draft', createdAt: '2023-04-12T18:00:00Z', source: 'user' },
    { _id: 'r6', title: "Fiona's Famous Fish Tacos", author: "Fiona's Fine Foods", status: 'pending', createdAt: '2023-07-01T09:00:00Z', source: 'vendor' }, // Example pending recipe
  ];