// src/components/SearchBar.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { debounce } from "../utils/apiUtils";

function SearchBar({ onSearch, suggestions = [] }) {
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const dropdownRef = useRef(null);

  // Create a debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      if (searchTerm.trim().length > 0) {
        onSearch(searchTerm);
        setIsDropdownOpen(false);
        setIsTyping(false);
      }
    }, 500),
    [onSearch]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsTyping(true);
    
    if (value.length > 0) {
      setIsDropdownOpen(true);
      debouncedSearch(value);
    } else {
      setIsDropdownOpen(false);
      setIsTyping(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      onSearch(query);
      setIsDropdownOpen(false);
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setIsDropdownOpen(false);
    setIsTyping(false);
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
          className={`search-box ${isTyping ? 'typing' : ''}`}
          placeholder="Search for a recipe..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.length > 0 && suggestions.length > 0) {
              setIsDropdownOpen(true);
            }
          }}
        />
        <button type="submit" className="search-btn" aria-label="Search">
          {isTyping ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-search"></i>
          )}
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
