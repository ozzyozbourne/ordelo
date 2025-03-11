import { useState, useRef, useEffect } from "react";

function SearchBar({ onSearch, suggestions = [] }) {
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      onSearch(query);
      setIsDropdownOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setIsDropdownOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter suggestions based on current query
  const filteredSuggestions = suggestions.filter(
    suggestion => suggestion.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // Limit to 5 suggestions

  return (
    <div className="search-container" ref={dropdownRef}>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          className="search-box"
          placeholder="Search for a recipe..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length > 0) {
              setIsDropdownOpen(true);
            } else {
              setIsDropdownOpen(false);
            }
          }}
          onFocus={() => {
            if (query.length > 0 && suggestions.length > 0) {
              setIsDropdownOpen(true);
            }
          }}
        />
        <button type="submit" className="search-btn" aria-label="Search">
          <i className="fas fa-search"></i>
        </button>
      </form>

      {isDropdownOpen && filteredSuggestions.length > 0 && (
        <div className="search-suggestions">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="search-suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <i className="fas fa-search suggestion-icon"></i>
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;