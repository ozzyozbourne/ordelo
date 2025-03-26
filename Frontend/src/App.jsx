import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import Home from "./pages/Home";
import RecipeDetails from "./pages/RecipeDetails";
import SavedRecipes from "./pages/SavedRecipes";
import ShoppingList from "./pages/ShoppingList";
import Orders from "./pages/Orders";
import AddRecipe from "./pages/AddRecipe";
import Footer from "./components/Footer";
import { RecipeProvider } from "./context/RecipeContext";
import ScrollToTop from "./components/ScrollToTop";
import SelectedRecipesModal from "./components/SelectedRecipesModal";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    // Attempt to initialize IndexedDB when the app loads
    const checkIndexedDB = async () => {
      try {
        // Feature detection for IndexedDB
        if (!window.indexedDB) {
          console.warn('Your browser doesn\'t support IndexedDB. Some features may not work properly.');
          return;
        }
        
        // Try to open a connection (this will initialize the DB)
        const dbOpenRequest = indexedDB.open('ordelo-recipe-cache', 1);
        
        dbOpenRequest.onerror = (event) => {
          console.error('IndexedDB initialization error:', event.target.error);
        };
        
        dbOpenRequest.onsuccess = () => {
          console.log('IndexedDB initialized successfully');
        };
      } catch (error) {
        console.error('Error checking IndexedDB support:', error);
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
    <RecipeProvider>
      <Router>
        <ScrollToTop />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipe/:id" element={<RecipeDetails />} />
            <Route path="/saved-recipes" element={<SavedRecipes />} />
            <Route path="/shopping-list" element={<ShoppingList />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/add-recipe" element={<AddRecipe />} />
          </Routes>
        </main>
        <SelectedRecipesModal />
        <Footer />
      </Router>
    </RecipeProvider>
  );
}

export default App;