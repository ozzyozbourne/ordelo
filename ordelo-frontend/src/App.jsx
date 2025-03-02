import { BrowserRouter as Router } from "react-router-dom";
import { useState } from "react";
import Header from "./components/Header";
import PageNavbar from "./components/PageNavbar";
import Footer from "./components/Footer";
import Recipes from "./pages/Recipes";
import RecipeDetails from "./pages/RecipeDetails";
import List from "./pages/List";

console.log("App component is rendering..."); // ✅ Debugging Log

function App() {
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  return (
    <Router>
      <Header />
      <PageNavbar />

      {/* Recipe Details as an Expandable Card */}
      {selectedRecipeId && (
        <RecipeDetails id={selectedRecipeId} close={() => setSelectedRecipeId(null)} />
      )}

      {/* Main Scrolling Sections */}
      <main className="flex flex-col">
        <section id="recipes" className="min-h-screen p-8 bg-gray-100">
          <Recipes onSelectRecipe={setSelectedRecipeId} />
        </section>
        <section id="list" className="min-h-screen p-8 bg-white">
          <List />
        </section>
      </main>

      <Footer />
    </Router>
  );
}

export default App;
