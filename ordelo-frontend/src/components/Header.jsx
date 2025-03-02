function Header() {
    return (
      <header className="bg-white shadow-md p-4 flex items-center justify-between fixed top-0 w-full z-50">
        {/* Invisible Placeholder for Left-Side Balance */}
        <div className="w-24"></div>
  
        {/* Centered Logo */}
        <div className="text-2xl font-bold text-blue-600 absolute left-1/2 -translate-x-1/2">
          Ordelo
        </div>
  
        {/* User Settings (Right Side) */}
        <div className="flex space-x-4">
          <button className="text-gray-700 hover:text-blue-500">Settings</button>
          <button className="text-gray-700 hover:text-blue-500">Account</button>
        </div>
      </header>
    );
  }
  
  export default Header;

  