// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Layout & Components
import ScrollToTop from "./components/ScrollToTop";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SelectedRecipesModal from "./components/SelectedRecipesModal";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { RecipeProvider } from "./context/RecipeContext";
import { ShoppingProvider } from "./context/ShoppingContext";

// Pages
import Home from "./pages/Home";
import SavedRecipes from "./pages/SavedRecipes";
import ShoppingList from "./pages/ShoppingList";
import ShoppingPage from "./pages/ShoppingPage";
import Orders from "./pages/Orders";
import AddRecipe from "./pages/AddRecipe";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ProfilePage from "./pages/ProfilePage";
import UserDashboard from "./pages/UserDashboard";
import VendorLogin from "./pages/VendorLogin";
import VendorRegister from "./pages/VendorRegister";
import AdminLoginPage from "./pages/AdminLoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import RecipeDetails from "./pages/RecipeDetails";
import HelpAndSupport from "./pages/HelpAndSupport";


// Admin Pages
import UserManagementPage from "./admin/pages/UserManagementPage";
import VendorManagementPage from "./admin/pages/VendorManagementPage";
import IngredientManagementPage from "./admin/pages/IngredientManagementPage";

// Admin Layout
import AdminDashboardLayout from "./admin/layouts/AdminDashboardLayout";

// Auth Components
import PrivateRoute from "./components/PrivateRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

// Vendor Layout
import VendorLayout from "./pages/Vendor/VendorLayout";
// Vendor Pages
import VendorStore from "./pages/Vendor/VendorStore";
import VendorInventory from "./pages/Vendor/Inventory";
import VendorDashboard from "./pages/Vendor/VendorDashboard";


// Styles
import "./App.css";
import "./styles/auth.css";
import "./styles/profile.css";
import "./styles/admin-styles.css";
import "./styles/open-props-core.css";

function AdminRoutes() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProtectedAdminRoute>
      <AdminDashboardLayout isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
        <Routes>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="vendors" element={<VendorManagementPage />} />
          <Route path="ingredients" element={<IngredientManagementPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AdminDashboardLayout>
    </ProtectedAdminRoute>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1500);

    const checkIndexedDB = async () => {
      try {
        if (!window.indexedDB) {
          console.warn("Your browser doesn't support IndexedDB.");
          return;
        }

        const dbOpenRequest = indexedDB.open("ordelo-recipe-cache", 1);

        dbOpenRequest.onerror = (event) => {
          console.error("IndexedDB error:", event.target.error);
        };

        dbOpenRequest.onsuccess = () => {
          console.log("IndexedDB initialized");
        };
      } catch (error) {
        console.error("IndexedDB check error:", error);
      }
    };

    checkIndexedDB();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <h2 className="logo">Ordelo</h2>
        <p>Getting everything ready...</p>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <RecipeProvider>
          <ShoppingProvider>
            <ScrollToTop />
            <Routes>

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/*" element={<AdminRoutes />} />

              {/* User Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Vendor Auth Routes */}
              <Route path="/vendor/login" element={<VendorLogin />} />
              <Route path="/vendor/register" element={<VendorRegister />} />

              {/* Vendor Layout Routes */}
              <Route path="/vendor/*" element={<VendorLayout />}>
                <Route path="dashboard" element={<VendorDashboard />} />
                <Route path="store" element={<VendorStore />} />
                <Route path="inventory" element={<VendorInventory />} />

              </Route>

              {/* Public Routes */}
              <Route path="/" element={
                <>
                  <Header />
                  <main>
                    <Home />
                  </main>
                  <Footer />
                  <SelectedRecipesModal />
                </>
              } />

              <Route path="/help-support" element={
                <>
                  <Header />
                  <main>
                    <HelpAndSupport />
                  </main>
                  <Footer />
                </>
              } />

              <Route path="/shopping-list" element={
                <>
                  <Header />
                  <main>
                    <ShoppingList />
                  </main>
                  <Footer />
                </>
              } />

              <Route path="/shopping" element={
                <>
                  <Header />
                  <main>
                    <ShoppingPage />
                  </main>
                  <Footer />
                </>
              } />

              <Route path="/orders" element={
                <>
                  <Header />
                  <main>
                    <Orders />
                  </main>
                  <Footer />
                </>
              } />

              <Route path="/recipe/:id" element={
                <>
                  <Header />
                  <main>
                    <RecipeDetails />
                  </main>
                  <Footer />
                  <SelectedRecipesModal />
                </>
              } />

              {/* Protected User Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/profile" element={
                  <>
                    <Header />
                    <main>
                      <ProfilePage />
                    </main>
                    <Footer />
                  </>
                } />

                <Route path="/userdashboard" element={
                  <>
                    <Header />
                    <main>
                      <UserDashboard />
                    </main>
                    <Footer />
                  </>
                } />

                <Route path="/saved-recipes" element={
                  <>
                    <Header />
                    <main>
                      <SavedRecipes />
                    </main>
                    <Footer />
                    <SelectedRecipesModal />
                  </>
                } />

                <Route path="/add-recipe" element={
                  <>
                    <Header />
                    <main>
                      <AddRecipe />
                    </main>
                    <Footer />
                  </>
                } />
              </Route>

              {/* Catch-All */}
              <Route path="*" element={
                <>
                  <Header />
                  <main>
                    <NotFoundPage />
                  </main>
                  <Footer />
                </>
              } />
            </Routes>
          </ShoppingProvider>
        </RecipeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
