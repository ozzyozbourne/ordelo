import { Link } from "react-router-dom";

console.log("PageNavbar component is rendering..."); // Debugging Log

function PageNavbar() {
  return (
    <nav className="bg-blue-500 text-white p-4 shadow-md fixed top-14 left-0 w-full z-40">
      <ul className="flex justify-around px-6">
        <li>
          <a href="#recipes" className="hover:underline">Recipes</a>
        </li>
        <li>
          <a href="#list" className="hover:underline">List</a>
        </li>
        <li>
          <Link to="/shopping" className="hover:underline">Shopping</Link>
        </li>
        <li>
          <Link to="/orders" className="hover:underline">Orders</Link>
        </li>
      </ul>
    </nav>
  );
}

export default PageNavbar;
