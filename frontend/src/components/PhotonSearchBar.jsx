import React, { useState, useRef } from "react";

export default function PhotonSearchBar({
  placeholder,
  onSelect,
  initialValue = "",
}) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef();
  const timeoutRef = useRef();

  const fetchSuggestions = async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(
          q
        )}&limit=5&bbox=88.0,20.5,92.7,26.7`
      );
      const data = await res.json();
      setSuggestions(
        (data.features || []).map((f) => ({
          name:
            f.properties.name || f.properties.city || f.properties.country || q,
          desc: f.properties.country
            ? `${f.properties.city ? f.properties.city + ", " : ""}${
                f.properties.country
              }`
            : "",
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }))
      );
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (s) => {
    setQuery(s.name);
    setShowDropdown(false);
    setSuggestions([]);
    onSelect && onSelect(s);
  };

  React.useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={inputRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder || "Search for a place..."}
        className="photon-search-input"
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 16,
          border: "1.5px solid #cbd5e1",
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(8px)",
          fontSize: 17,
          fontWeight: 500,
          boxShadow: "0 2px 12px #0001",
          outline: "none",
          marginBottom: 4,
          transition: "border 0.2s",
        }}
      />
      {showDropdown && suggestions.length > 0 && (
        <div
          className="photon-search-dropdown"
          style={{
            position: "absolute",
            top: 48,
            left: 0,
            right: 0,
            zIndex: 20,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            borderRadius: 16,
            boxShadow: "0 4px 24px #0002",
            border: "1.5px solid #cbd5e1",
            padding: 4,
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => handleSelect(s)}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 500,
                color: "#222",
                background: i === 0 ? "rgba(59,130,246,0.07)" : "transparent",
                marginBottom: 2,
                transition: "background 0.15s",
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span>{s.name}</span>
              {s.desc && (
                <span style={{ color: "#64748b", fontSize: 14, marginLeft: 8 }}>
                  {s.desc}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {loading && (
        <div
          style={{ position: "absolute", right: 18, top: 14, color: "#2563eb" }}
        >
          <span className="animate-spin">⏳</span>
        </div>
      )}
    </div>
  );
}