import React from "react";

function List() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-yellow-500">Your Shopping List</h1>
      <p className="text-lg mt-2">Auto-generated from your selected recipes.</p>

      <ul className="mt-6 space-y-3">
        <li className="bg-gray-200 p-4 rounded-lg">🍅 Tomatoes</li>
        <li className="bg-gray-200 p-4 rounded-lg">🥩 Chicken Breast</li>
        <li className="bg-gray-200 p-4 rounded-lg">🧀 Cheese</li>
      </ul>
    </div>
  );
}

export default List;
