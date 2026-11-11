function SearchInput({ value, onChange }) {
  return (
    <input
      className="search-input"
      type="text"
      placeholder="Search cars by name..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
export default SearchInput;