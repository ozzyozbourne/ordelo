import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("Main.jsx is running..."); // ✅ Debugging Log

ReactDOM.createRoot(document.getElementById("root")).render(
  // Remove StrictMode to prevent double rendering in development
  <App />
);
