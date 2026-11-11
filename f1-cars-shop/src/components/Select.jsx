import React from 'react';

function Select({ options, onChange, label, defaultText = "Select..." }) {
  return (
    <div className="select-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
      {label && <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>{label}</label>}
      <select 
        onChange={(e) => onChange(e.target.value)}
        className="main-select"
        style={{ padding: '8px', borderRadius: '5px' }}
      >
        <option value="">{defaultText}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Select;